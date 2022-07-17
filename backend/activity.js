const db = require("./db/db");
const noblox = require("noblox.js");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const express = require("express");
const router = express.Router();

let activews = [];

const erouter = (cacheEngine, settings, permissions, automation) => {
  let perms = permissions.perms;
  let checkPerm = permissions.checkPerm;

  router.ws("/socket", (ws, req) => {
    if (!checkPerm(req.user.sessionid)) return;
    if (!req.session.userid) {
      ws.close();
      return;
    }

    ws.send(
      JSON.stringify({
        type: "init",
        message: "connected to web",
      })
    );

    activews.push(ws);
    ws.on("close", () => {
      activews.splice(activews.indexOf(ws), 1);
    });
  });

  router.post("/createsession", async (req, res) => {
    if (req.headers.authorization !== settings.get("activity").key)
      return res.status(401);
      if (!req.body.userid) return res.status(400).json({ error: "no userid" });
      if (typeof req.body.userid !== 'number') return res.status(400).json({ error: "userid is not a number" });
    if (settings.get("activity")?.role) {
      let userrank = await noblox
        .getRankInGroup(settings.get("group"), req.body.userid)
        .catch((err) => null);
      if (!userrank)
        return res
          .status(200)
          .json({ message: "User is not high enough rank!" });
      if (userrank < settings.get("activity").role) {
        return res
          .status(200)
          .json({ message: "User is not high enough rank!" });
      }
    }
    let session = await db.session.findOne({
      uid: req.body.userid,
      active: true,
    });

    if (session) return res.status(400).json({ message: "Active session!!" });
    let fpfp = await cacheEngine.fetchpfp(req.body.userid);
    let username = await cacheEngine.fetchusername(req.body.userid);
    await db.session.create({
      active: true,
      start: new Date(),
      uid: req.body.userid,
    });

    activews.forEach((ws) => {
      ws.send(
        JSON.stringify({
          type: "playadd",
          data: {
            uid: req.body.userid,
            pfp: fpfp,
            username: username,
          },
        })
      );
    });

    automation.runEvent("staffjoin", {
      id: req.body.userid,
      username: username,
    });

    res.status(200).json({ message: "Successfully created session!" });
  });

  router.get("/ias/unaprooved", perms("manage_notices"), async (req, res) => {
    let uid = req.session.userid;

    if (!uid) return res.status(401).json({ message: "go away!" });

    let ias = await db.ia.find({ status: "none" });
    let s = [];
    for (ia of ias) {
      let e = ia.toObject();
      let username = await cacheEngine.fetchusername(ia.uid);
      e.username = username;
      s.push(e);
      if (ias.indexOf(ia) == ias.length - 1) {
        res
          .status(200)
          .json({ message: "Successfully fetched unaprooved ias!", ias: s });
      }
    }
  });

  router.get("/ias/deny/:id", perms("manage_notices"), async (req, res) => {
    let uid = req.session.userid;

    if (!uid) return res.status(401).json({ message: "go away!" });

    let ia = await db.ia.findOne({
      status: "none",
      id: parseInt(req.params.id),
    });
    if (!ia) return res.status(400).json({ message: "No such ia!" });
    ia.status = "denied";
    await ia.save();

    res.status(200).json({ message: "Successfully denied ia!" });
  });

  router.get("/ias/accept/:id", async (req, res) => {
    let uid = req.session.userid;

    if (!uid) return res.status(401).json({ message: "go away!" });

    let ia = await db.ia.findOne({
      status: "none",
      id: parseInt(req.params.id),
    });
    if (!ia) return res.status(400).json({ message: "No such ia!" });
    ia.status = "accepted";
    await ia.save();

    res.status(200).json({ message: "Successfully denied ia!" });
  });

  router.post("/endsession", async (req, res) => {
    if (req.headers.authorization !== settings.get("activity").key)
      return res.status(401);
      if (typeof req.body.userid !== 'number') return res.status(400).json({ error: "userid is not a number" });

    if (typeof req.body.userid !== "number")
      return res.status(400).json({ message: "Userid must be a number!" });
    let session = await db.session.findOne({
      uid: req.body.userid,
      active: true,
    });

    if (!session)
      return res.status(400).json({ message: "No active session found!" });
    session.end = new Date();
    session.active = false;
    await session.save();

    activews.forEach((ws) => {
      ws.send(
        JSON.stringify({
          type: "playrm",
          data: {
            uid: req.body.userid,
          },
        })
      );
    });

    automation.runEvent("staffleave", {
      id: req.body.userid,
      username: cacheEngine.fetchusername(req.body.userid),
    });

    res.status(200).json({ message: "Successfully ended session!" });
  });

  router.get("/@me", async (req, res) => {
    let userid = req.session.userid;

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
    let d = [...sessions, ...ias];
    res
      .status(200)
      .json({ sessions: d, totaltime: Math.round(_.sumBy(sessions, "time")) });
  });

  router.post("/createia", perms(""), async (req, res) => {
    let userid = req.session.userid;

    if (!userid) return res.status(401).json({ message: "Get out!" });
    let dcount = await db.ia.countDocuments({});
    let dataarray = req.body.date.sort((a, b) => a - b);
    let data = {
      start: dataarray[0],
      end: dataarray[1],
      uid: userid,
      id: dcount,
      status: "none",
      reason: req.body.r,
    };
    let ia = await db.ia.create(data);

    res.status(200).json({ message: "Successfully created ia!", data: data });
  });

  router.get("/best", perms("view_staff_activity"), async (req, res) => {
    let sessions = await db.session.find({});
    if (!sessions.length) return res.status(200).json([]);
    let e = _.groupBy(sessions, (i) => i.uid);
    let arr = Object.values(e).map((c) => ({ uid: c[0].uid, l: c.length }));
    let sorted = arr.sort((a, b) => b.l - a.l).slice(0, 10);
    let s = [];
    for (user of sorted) {
      let uname = await cacheEngine.fetchusername(user.uid);
      let pfp = await cacheEngine.fetchpfp(user.uid);
      user.pfp = pfp;
      user.username = uname;
      s.push(user);
      if (sorted.indexOf(user) == sorted.length - 1) {
        res.status(200).json(s);
      }
    }
  });

  router.get(
    "/activityinfo",
    perms("view_staff_activity"),
    async (req, res) => {
      let sessions = await db.session.find({ active: true });
      if (!sessions.length) return res.status(200).json([]);
      let s = [];

      for (session of sessions) {
        let e = session.toObject();
        let userinfo = await cacheEngine.fetchusername(session.uid);
        let pfp = await cacheEngine.fetchpfp(session.uid);
        e.pfp = pfp;
        e.username = userinfo;
        s.push(e);
        if (sessions.indexOf(session) == sessions.length - 1) {
          res.status(200).json(s);
        }
      }
    }
  );

  router.get("/stats", perms("view_staff_activity"), async (req, res) => {
    let sessions = await db.session.find({});
    let des = await db.session.distinct("uid")
    let e = _.groupBy(sessions, (i) => i.uid);
    let arr = sessions.map((e) => {
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
    let sorted = arr.sort((a, b) => b.l - a.l).slice(0, 10);
    let s = [];
    let grouped = _.groupBy(sorted, (i) => i.uid);

    res.status(200).json({
      staff: des.length,
      sessions: arr.length,
      mins: Math.floor(
        _.sumBy(arr, function (i) {
          if (!isNaN(i.time)) {
            return i.time;
          } else {
            return 0;
          }
        })
      ),
    });
  });

  router.get("/off", perms("view_staff_activity"), async (req, res) => {
    if (!req.session.userid) {
      return res.status(401).json({ message: "Not logged in" });
    }

    let e = await db.ia.find({
      end: { $gte: Date.now() },
      start: { $lte: Date.now() },
      status: "accepted",
    });
    let s = [];

    for (ia of e) {
      let g = ia.toObject();
      let uname = await cacheEngine.fetchusername(ia.uid);
      let pfp = await cacheEngine.fetchpfp(ia.uid);
      g.pfp = pfp;
      g.username = uname;
      s.push(g);
      if (e.indexOf(ia) == e.length - 1) {
        res.status(200).json(s);
      }
    }
  });




  return router;
};

module.exports = erouter;
