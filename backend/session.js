const db = require("./db/db");
const noblox = require("noblox.js");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const express = require("express");
const discord = require("discord.js");
let package = require("../package.json");
const axios = require("axios");
const router = express.Router();

let activews = [];

const erouter = (cacheEngine, settings, permissions, automation) => {
  const perms = permissions.perms;

  router.use((req, res, next) => {
    if (!settings.get("sessions")?.enabled) {
      return res.status(403).send("Forbidden");
    }
    next();
  });

  setInterval(async () => {
    let essions = await db.gsession.find({
      started: false,
      start: { $lt: new Date() },
    });
    essions.forEach(async (session) => {
      let ssession = await db.gsession.findOne({ id: session.id });
      if (ssession.end) {
        ssession.started = true;
        ssession.save();
        return;
      }
      ssession.started = true;
      ssession.did = await sendlog(session);
      automation.runEvent("sessionstarted", {
        type: ssession.type.name,
        id: ssession.id,
        username: await cacheEngine.fetchusername(ssession.uid),
        game: ssession.type.gname,
      });
      await ssession.save();
    });
  }, 60000);

  async function sendlog(data) {
    if (!settings.get("sessions")?.discohook) return null;
    let games = settings.get("sessions").games;
    console.log(games);
    console.log(data.type);
    let game = games.find((g) => g.id == data.type.id);
    let webhook = settings.get("sessions").discohook;

    let webhookc = new discord.WebhookClient({
      url: game?.woverride || webhook,
    });
    let username = await cacheEngine.fetchusername(data.uid);
    let pfp = await cacheEngine.fetchpfp(data.uid);

    let embed = new discord.MessageEmbed()
      .setTitle(
        gmsg(
          game?.embedtitle ||
            `%TYPE% is now being hosted and will commence shortly!`
        )
      )
      .setColor("GREEN")
      .setTimestamp()
      .setAuthor(username, pfp, `https://www.roblox.com/users/${data.uid}`)
      .setDescription(
        gmsg(
          game?.embedbody ||
            `A %TYPE% is now being hosted by %HOST%! Join the game below to attend this session.`
        )
      )
      .addField(
        "Gamelink",
        `https://www.roblox.com/games/${data.type.gid}/-`,
        true
      )
      .setImage(data.thumbnail)
      .setFooter({ text: `Tovy Sessions` });

    let components = new discord.MessageActionRow().addComponents(
      new discord.MessageButton({
        style: "LINK",
        label: "Join",
        url: `https://www.roblox.com/games/${data.type.gid}/-`,
      })
    );

    let ping = game.prefix || settings.get("sessions").discoping || null;

    let msg = await webhookc
      .send({ content: ping, embeds: [embed], components: [components] })
      .catch((err) => {});

    function gmsg(text) {
      let replacements = {};
      replacements[`%TYPE%`] = data.type.name;
      replacements[`%HOST%`] = username;
      replacements[`%GAME%`] = data.type.gid;

      return text.replace(/%\w+%/g, (all) => {
        return typeof replacements[all] !== "undefined"
          ? replacements[all]
          : all;
      });
    }

    return msg?.id;
  }

  async function unsendlog(data) {
    if (!settings.get("sessions")?.discohook) return null;
    if (!data?.did) return null;
    let games = settings.get("sessions").games;
    let game = games.find((g) => g.id == data.type.id);

    let webhook = settings.get("sessions").discohook;

    let webhookc = new discord.WebhookClient({
      url: game?.woverride || webhook,
    });
    let username = await cacheEngine.fetchusername(data.uid);
    let pfp = await cacheEngine.fetchpfp(data.uid);

    let embed = new discord.MessageEmbed()
      .setTitle(`${data.type.name} ended`)
      .setColor("RED")
      .setTimestamp()
      .setAuthor(username, pfp, `https://www.roblox.com/users/${data.uid}`)
      .setDescription(
        gmsg(game?.endbody || `The %TYPE% hosted by %HOST% has ended! We will host more very soon don't worry`)
      )
      .setFooter({ text: `Tovy sessions` });

      function gmsg(text) {
        let replacements = {};
        replacements[`%TYPE%`] = data.type.name;
        replacements[`%HOST%`] = username;
        replacements[`%GAME%`] = data.type.gid;
  
        return text.replace(/%\w+%/g, (all) => {
          return typeof replacements[all] !== "undefined"
            ? replacements[all]
            : all;
        });
      }

    let msg = await webhookc
      .editMessage(data.did, { content: null, embeds: [embed], components: [] })
      .catch((err) => {});
    return msg.id;
  }

  router.post("/session/end", perms("host_sessions"), async (req, res) => {
    if (!req.body?.id)
      return res
        .status(400)
        .send({ success: false, message: "No session id provided" });
    if (typeof req.body.id !== "number")
      return res
        .status(400)
        .send({ success: false, message: "Session id must be a number" });
    let session = await db.gsession.findOne({ id: req.body.id });
    if (!session) res.status(404).send("Session not found");

    session.end = new Date();
    session.save();
    automation.runEvent("sessionended", {
      type: session.type.name,
      id: session.id,
      username: await cacheEngine.fetchusername(session.uid),
      game: session.type.gname,
    });

    await unsendlog(session);

    res.status(200).send({ success: true });
  });

  router.get("/session/:id", async (req, res) => {
    if (!req.params.id)
      return res
        .status(400)
        .send({ success: false, message: "No session id provided" });
    if (typeof req.params.id !== "string")
      return res
        .status(400)
        .send({ success: false, message: "Session id must be a number" });
    let session = await db.gsession.findOne({ id: req.params.id });
    if (!session)
      return res
        .status(404)
        .send({ success: false, error: "Session not found" });

    let data = {
      ...session._doc,
      user: {
        username: await cacheEngine.fetchusername(session.uid),
        pfp: await cacheEngine.fetchpfp(session.uid),
      },
    };
    res.send({ success: true, data });
  });

  router.get("/list", async (req, res) => {
    let sessions = await db.gsession.find({});
    let mx = await Promise.all(
      sessions.map(async (m) => {
        return {
          ...m._doc,
          user: {
            username: await cacheEngine.fetchusername(m.uid),
            pfp: await cacheEngine.fetchpfp(m.uid),
          },
        };
      })
    );
    res.status(200).send(mx);
  });

  //session db is db.gsession
  router.get("/games", perms("host_sessions"), async (req, res) => {
    let games = settings.get("sessions").games;
    let game = await noblox.getUniverseInfo(
      games.filter((m) => m.id).map((m) => m.id)
    );

    res.send(
      games.map((m) => {
        let e = game.find((f) => f.id == m.id);
        return {
          type: m.type,
          id: m.id,
          gameinfo: {
            name: e?.name,
            description: e?.description,
          },
        };
      })
    );
  });

  router.post("/hostsession", perms("host_sessions"), async (req, res) => {
    let data = req.body;
    let id = parseInt(await db.gsession.countDocuments({}));
    let treq = await axios.get(
      `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${req.body.game}&size=768x432&format=Png&isCircular=false`
    );
    let thumbnail = treq.data.data[0]?.thumbnails[0]?.imageUrl;
    let ginfo = await noblox.getUniverseInfo(req.body.type).catch((e) => null);
    let dbdata = {
      id: id + 1,
      start: data.date || Date.now(),
      uid: req.session.userid,
      thumbnail,
      started: data.now,
      type: {
        id: req.body.type || null,
        name:
          settings.get("sessions").games.find((f) => f.id == req.body.type)
            ?.type || "Unknown",
        gname: ginfo[0]?.name || "Unknown",
        gid: ginfo[0]?.rootPlaceId || 0,
      },
    };
    if (data.now) dbdata.did = await sendlog(dbdata);
    if (data.now)
      automation.runEvent("sessionstarted", {
        type: dbdata.type.name,
        id: dbdata.id,
        username: await cacheEngine.fetchusername(dbdata.uid),
        game: dbdata.type.gname,
      });

    await db.gsession.create(dbdata);

    //let webhook = new WebhookClient()

    res.send({
      ...dbdata,
      user: {
        username: await cacheEngine.fetchusername(req.session.userid),
        pfp: await cacheEngine.fetchpfp(req.session.userid),
      },
    });
  });

  return router;
};

module.exports = erouter;
