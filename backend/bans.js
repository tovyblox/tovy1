const express = require("express");
const router = express.Router();
const db = require("./db/db");
const noblox = require("noblox.js");

const erouter = (cacheEngine, settings, permissions, logging) => {
  const perms = permissions.perms;
  router.get("/bans", async (req, res) => {
    let bans = await db.ban.find({});
    res.status(200).json({ bans: bans });
  });

  router.post("/ban", perms("manage_bans"), async (req, res) => {
    const bannedBy = req.session.userid;
    const { username, reason, until, perm } = req.body;
    if (!username)
      return res.status(400).json({ error: "No username provided." });
    if ((!until && perm == false) || perm == null)
      return res.status(400).json({ error: "No date provided." });
    const id = await noblox.getIdFromUsername(username).catch(e => null);
    if (!id) {
      res.status(400).json({ message: "No such user!" });
      return;
    }
    await db.ban.create({
      userid: id,
      reason: reason,
      until,
      banned: true,
      bannedby: bannedBy,
      permanent: perm ?? false,
    });
    res.status(200).json({ success: true });
    logging.newLog(
      `has banned **${username}** for **${reason}** ${
        until ? "until " + until : "permanently"
      }`,
      req.session.userid
    );
  });
  router.post("/unban", perms("manage_bans"), async (req, res) => {
    const { userid } = req.body;
    if (!userid) return res.status(400).json({ error: "No userid provided." });
    const username = await noblox.getUsernameFromId(userid);
    await db.ban.deleteOne({ userid });
    logging.newLog(`has unbanned ${username}`, req.session.userid);
    res.status(200).json({ success: true });
  });
  router.post("/edit", perms("manage_bans"), async (req, res) => {
    const { userid, reason, until, bannedReason } = req.body;
    if (!userid) return res.status(400).json({ error: "No userid provided." });
    const username = await noblox.getUsernameFromId(userid);
    if (!reason) return res.status(400).json({ error: "No reason provided." });
    const ban = await db.ban.findOne({ userid });
    // uupdate the ban using updateOne
    const b = await ban.update({ reason: reason });
    logging.newLog(
      `has edited ban for **${username}**. New reason: **${reason}**`,
      req.session.userid
    );
    res.status(200).json({ success: true, message: "Ban updated.", b });
  });
  router.get("/banned/:userid", perms('view_staff_activity'), async (req, res) => {
    const { userid } = req.params;
    let banned = await db.ban.findOne({ userid });
    if (banned == null) return res.status(200).json({banned: false});
    const today = new Date();
    if (banned.until < today && banned.permanent == false) {
      await db.ban.updateOne({ banned: false }, { userid });
      return res.json({banned: false});
    }
    res.status(200).json(banned);
  });
  router.get("/gbanned/:userid", async (req, res) => {
    if (req.headers.authorization !== settings.get("activity").key)
      return res.status(401);
    const { userid } = req.params;
    let banned = await db.ban.findOne({ userid });
    if (banned == null) return res.status(200).json({banned: false});
    const today = new Date();
    if (banned.until < today && banned.permanent == false) {
      await db.ban.updateOne({ banned: false }, { userid });
      return res.json({banned: false});
    }
    res.status(200).json(banned);
  });
  return router;
};
module.exports = erouter;
