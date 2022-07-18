const db = require("./db/db");
const noblox = require("noblox.js");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const express = require("express");
const { default: axios } = require("axios");
const router = express.Router();

let activews = [];

const erouter = (cacheEngine, settings, permissions, automation) => {
  let perms = permissions.perms;
  router.get("/gmembers", perms("manage_staff_activity"), async (req, res) => {
    if (!req.query.role) {
      res.status(200).json({ message: "No role specified" });
      return;
    }
    let role = await noblox
      .getRole(settings.get("group"), parseInt(req.query.role))
      .catch((err) => {
        res.status(400).json({ message: "No such role!" });
        return null;
      });
    if (!role) return;
    let groupreq = await axios.get(`https://groups.roblox.com/v1/groups/${settings.get("group")}/roles/${role.id}/users?limit=10${req.query.cursor ? `&cursor=${req.query.cursor}` : ''}`, {})
    let members = groupreq.data.data
    if (groupreq.data.nextPageCursor) {
      let groupreq2 = await axios.get(`https://groups.roblox.com/v1/groups/${settings.get("group")}/roles/${role.id}/users?limit=10&cursor=${groupreq.data.nextPageCursor}`, {})
      groupreq2.data.data.forEach(async m => {
        await cacheEngine.fetchpfp(m.userId);
      })
    }
    let mx = await Promise.all(
      members.map(async (m) => {
        m.pfp = await cacheEngine.fetchpfp(m.userId);
        m.selected = false;

        let sessions = await db.session.find({ uid: m.userId, active: false });
        sessions = [...sessions].map((e) => {
          let time;
          if (!e.mins) {
            const d2 = new Date(e.start);
            const d1 = new Date(e.end);
            const diffMs = d1.getTime() - d2.getTime();
            const diffMins = diffMs / 1000 / 60;
            time = Math.round(diffMins);
          } else time = e.mins;

          return { ...e._doc, time: time, type: e.type || "session" };
        });
        let ias = await db.ia.find({ uid: m.userId });
        ias = [...ias].map((e) => {
          return { ...e._doc, type: "IA" };
        });
        let d = [...sessions, ...ias].sort((a, b) => b.start - a.start);

        const conv = (mins) => {
          return `${String(Math.floor(mins / 60)).padStart(
            1,
            "0"
          )} hours, ${String(mins % 60).padStart(1, "0")} minutes`;
        };

        m.time = conv(Math.round(_.sumBy(sessions, "time")));

        return m;
      })
    );

    res.status(200).json({ members: await mx, nextcursor: groupreq.data.nextPageCursor, previouscursor: groupreq.data.previousPageCursor });
  });

  router.get(
    "/uprofile/:user",
    perms("manage_staff_activity"),
    async (req, res) => {
      let user = parseInt(req.params.user);
      let ruser;
      try {
        ruser = await noblox.getPlayerInfo(user);
      } catch (e) {
        return res.status(400).json({ message: "No such user!" });
      }

      res.status(200).json({
        username: ruser.username,
        info: ruser,
        pfp: await cacheEngine.fetchpfp(user),
      });
    }
  );

  router.get(
    "/pactivity/:user",
    perms("manage_staff_activity"),
    async (req, res) => {
      let userid = parseInt(req.params.user);

      if (!userid) return res.status(401).json({ message: "Get out!" });
      let sessions = await db.session.find({ uid: userid, active: false });
      sessions = [...sessions].map((e) => {
        let time;
        if (!e.mins) {
          const d2 = new Date(e.start);
          const d1 = new Date(e.end);
          const diffMs = d1.getTime() - d2.getTime();
          const diffMins = diffMs / 1000 / 60;
          time = Math.round(diffMins);
        } else time = e.mins;

        return { ...e._doc, time: time, type: e.type || "session" };
      });
      let ias = await db.ia.find({ uid: userid });
      ias = [...ias].map((e) => {
        return { ...e._doc, type: "IA" };
      });
      let d = [...sessions, ...ias].sort((a, b) => b.start - a.start);

      res.status(200).json({
        sessions: d,
        stats: {
          ia: ias.length,
          session: sessions.length,
          mins: Math.round(_.sumBy(sessions, "time")),
        },
      });
    }
  );

  router.get(
    "/book/:user",
    perms("manage_staff_activity"),
    async (req, res) => {
      let userid = parseInt(req.params.user);
      if (!userid) return res.status(404).json({ message: "No user!" });
      let books = await db.book.find({ userid: userid, deleted: { $ne: true } });
      res.status(200).json({ success: true, books });
    }
  );

  router.post("/book/add", perms("manage_staff_activity"), async (req, res) => {
    let userid = parseInt(req.body.userid);
    if (!userid)
      return res.status(404).json({ success: false, message: "No user!" });
    let type = req.body.type;
    if (!type)
      return res.status(400).json({ success: false, message: "No type!" });
    let notes = req.body.notes;
    let count = await db.book.countDocuments({});
    let book = new db.book({
      userid: userid,
      type: type,
      notes: notes,
      created: new Date(),
      deleted: false,
      id: count + 1,
    });
    if (type !== "Note") {
      automation.runEvent("staff_" + type.toLowerCase(), {
        id: userid,
        username: await noblox.getUsernameFromId(userid),
        moderator: await noblox.getUsernameFromId(req.session.userid),
        notes: notes || 'N/A',
      });
    }
    await book.save();
    res.status(200).json({ success: true, book });
  });

  router.delete('/book/:id', perms("manage_staff_activity"), async (req, res) => {
    let id = parseInt(req.params.id);
    if (!id) return res.status(404).json({ success: false, message: "No id!" });
    let book = await db.book.findOne({ id: id });
    if (!book) return res.status(404).json({ success: false, message: "No book!" });
    book.deleted = true;
    await book.save();
    res.status(200).json({ success: true, book });
  });


  router.get("/audit", perms("admin"), async (req, res) => {
    let logs = await db.log.find({});

    let mx = await Promise.all(
      logs.map(async (m) => {
        if (!m.automation)
          user = {
            username: await cacheEngine.fetchusername(m.userId),
            pfp: await cacheEngine.fetchpfp(m.userId),
          };
        else user = undefined;

        return {
          ...m._doc,
          user: user,
        };
      })
    );
    res.status(200).send({ success: true, logs: mx.reverse() });
  });

  router.post(
    "/mactivity/change",
    perms("manage_staff_activity"),
    async (req, res) => {
      if (!req.body?.mins)
        return res
          .status(400)
          .json({ success: false, message: "No minutes provides" });
      if (!req.body?.type)
        return res
          .status(400)
          .json({ success: false, message: "No type provides" });
      if (typeof req.body.mins !== "number")
        return res
          .status(400)
          .json({ success: false, message: "Minutes must be a number" });

      req.body.users.forEach(async (u) => {
        await db.session.create({
          active: false,
          mins: req.body.type === "remove" ? -req.body.mins : req.body.mins,
          uid: u,
          start: new Date(),
          type: req.body.type,
        });
      });

      res.status(200).json({ message: "Successfully changed activity" });
    }
  );

  router.get("/search", perms("manage_staff_activity"), async (req, res) => {
    let q = req.query.keyword;
    if (!q) return res.status(400).json({ message: "No query provided" });
    if (q.length < 3)
      return res
        .status(400)
        .json({ message: "Query must be at least 3 characters" });
    let users;
    try {
      users = await axios.get(
        `https://users.roblox.com/v1/users/search?keyword=${q}&limit=25`
      );
    } catch (e) {
      return res.status(200).json({ users: [] });
    }

    users = await Promise.all(
      users.data.data.map(async (e) => {
        return {
          username: e.name,
          id: e.id,
          pfp: await cacheEngine.fetchpfp(e.id),
          displayName: e.displayName,
        };
      })
    );
    res.status(200).json({ users });
  });

  router.post(
    "/mactivity/reset",
    perms("manage_staff_activity"),
    async (req, res) => {
      req.body.users.forEach(async (u) => {
        await db.session.deleteMany({ active: false, uid: parseInt(u) });
      });

      res.status(200).json({ message: "Successfully changed activity" });
    }
  );


  function chooseRandom(arr, num) {
    const res = [];
    for (let i = 0; i < num; ) {
      const random = Math.floor(Math.random() * arr.length);
      if (res.indexOf(arr[random]) !== -1) {
        continue;
      }
      res.push(arr[random]);
      i++;
    }
    return res;
  }


  return router;
};

module.exports = erouter;
