const express = require("express");
const router = express.Router();
const db = require("./db/db");
const noblox = require("noblox.js");

const erouter = (usernames, pfps, settings, permissions, logging) => {
  const perms = permissions.perms;
  router.get("/bans", async (req, res) => {
    let bans = await db.ban.find({});
    res.json({ bans: bans });
  });

  router.post("/ban", perms("manage_bans"), async (req, res) => {
    const bannedBy = req.session.userid;
    const { username, reason, until, perm } = req.body;
    if (!username) return res.status(400).json({ error: "No username provided." });
    if (!until && perm == false || perm == null) return res.status(400).json({ error: "No date provided." });    
    const id = await noblox.getIdFromUsername(username);
    if (!id) {
        res.status(400).json({ message: "No such user!" }); 
        return;
    }
    await db.ban.create({ userid: id, reason: reason, until, banned: true, bannedby: bannedBy, permanent: perm ?? false });
    res.json({ success: true });
    logging.newLog(`has banned **${username}** for **${reason}** ${until ? "until " + until : "permanently"}`, req.session.userid);  
  });
  router.post("/unban", perms("manage_bans"), async (req, res) => {
    const { userid } = req.body;
    if (!userid) return res.status(400).json({ error: "No userid provided." });
    const username = await noblox.getUsernameFromId(userid);
    await db.ban.deleteOne({ where: { userid } });
    logging.newLog(`has unbanned ${username}`, req.session.userid);
    res.json({ success: true });
  });
  router.post("/edit", perms("manage_bans"), async (req, res) => {
    const { userid, reason, until, bannedReason } = req.body;
    if (!userid) return res.status(400).json({ error: "No userid provided." });
    const username = await noblox.getUsernameFromId(userid);
    if (!reason) return res.status(400).json({ error: "No reason provided." });
    console.log(userid)
    console.log(reason)
    const ban = await db.ban.findOne({ where: { userid } });
    // uupdate the ban using updateOne
    const b = await ban.update({ reason: reason });
    logging.newLog(`has edited ban for **${username}**. New reason: **${reason}**`, req.session.userid);
    res.json({ success: true, message: "Ban updated.", b });
  });
  router.get("/banned/:userid", async (req, res) => {
    const { userid } = req.params;
    let banned = await db.ban.findOne({ where: { userid } });
    if (banned == null) return res.json({ banned: false });
    const today = new Date();
    if (banned.until < today && banned.permanent == false) {
        await db.ban.update({ banned: false }, { where: { userid } });
        return res.json({ banned: false });
    }
    res.json({ banned: banned });
  });
  router.get("/banned/name/:name", async (req, res) => {
    const { name } = req.params;
    const id = await noblox.getIdFromName(name);
    let banned = await db.ban.findOne({ where: { id: id } });
    if (banned == null) return res.json({ banned: false });
    const today = new Date();
    if (banned.until < today && banned.permanent == false) {
        await db.ban.update({ banned: false }, { where: { id } });
        return res.json({ banned: false });
    }
    res.json({ banned });
  });
  return router;
};
module.exports = erouter;
