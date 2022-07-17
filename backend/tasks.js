const db = require("./db/db");
const express = require("express");
const router = express.Router();
const erouter = (
  cacheEngine,
  settings,
  permissions,
  logging,
  automation
) => {
  const perms = permissions.perms;
  router.get("/task/:id", async (req, res) => {
    const { id } = req.params;
    const task = await db.task.findOne({ id: parseInt(id) });
    if (task == null) return res.status(400).json({ error: "No such task." });
    res.json({ task: task });
  });
  router.get("/@me", async (req, res) => {
    const userPerms = await db.user.findOne({ userid: req.session.userid });
    let tasks = await db.task.find({});
    tasks = await Promise.all(
      tasks.map(async (task) => {
        let username = await cacheEngine.fetchusername(task.author);
        let pfp = await cacheEngine.fetchpfp(task.author);
        return {
          ...task._doc,
          pfp,
          username,
        };
      })
    );
    const tasksToSend = [];
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (
        task.assignedUsers.includes(req.session.userid) ||
        task.assignedRoles.includes(userPerms.role) ||
        task.author == req.session.userid ||
        permissions.checkPerm(req.session.userid, "admin")
      ) {
        tasksToSend.push(task);
      }
    }
    res.status(200).send(tasksToSend);
  });

  router.post("/create", perms("manage_tasks"), async (req, res) => {
    const { name, description, due, assignedRoles, assignedUsers, priority } =
      req.body;
    if (!name) return res.status(400).json({ error: "No name provided." });
    if (!description)
      return res.status(400).json({ error: "No description provided." });
    if (!due) return res.status(400).json({ error: "No due date provided." });
    let currentid = await db.task.countDocuments({});
    let taskdata = {
      name: name,
      description: description,
      createdAt: new Date(),
      completed: false,
      due: due,
      id: currentid + 1,
      assignedRoles: assignedRoles,
      assignedUsers: assignedUsers,
      author: req.session.userid,
      priority: priority,
    };
    const task = await db.task.create(taskdata);
    res.status(200).json({ success: true, task: taskdata });
    automation.runEvent("taskcreated", {
      id: taskdata.id,
      username: await cacheEngine.fetchusername(req.session.userid),
      name: taskdata.name,
      details: taskdata.description,
    });
    logging.newLog(`has created a new task: **${name}**`, req.session.userid);
  });

  router.post("/edit", perms("manage_tasks"), async (req, res) => {
    let { id, name, description, due, assignedRoles, assignedUsers } = req.body;
    const task = await db.task.findOne({ id: id });
    if (!task.assignedBy == req.session.userid)
      return res.status(400).json({ error: "You can't edit this task." });
    if (task == null) return res.status(400).json({ error: "No such task." });
    if (!id) return res.status(400).json({ error: "No id provided." });
    if (!name) name = task.name;
    if (!description) description = task.description;
    if (!due) due = task.due;
    if (!assignedRoles) assignedRoles = task.assignedRoles;
    if (!assignedUsers) assignedUsers = task.assignedUsers;
    await task.update({
      name: name,
      description: description,
      due: due,
      assignedRoles: assignedRoles,
      assignedUsers: assignedUsers,
    });
    res.status(200).json({ success: true, task: task });
    logging.newLog(`has edited a task: **${name}**`, req.session.userid);
  });

  router.delete("/:id", perms("manage_tasks"), async (req, res) => {
    const { id } = req.params;
    let tsk = await db.task.findOne({ id: parseInt(id) });
    if (!tsk) return res.status(400).json({ error: "No such task." });
    if (!tsk.assignedBy == req.session.userid) return res.status(400).json({});
    const task = await db.task.deleteOne({ id: parseInt(id) });
    res.status(200).json({ success: true });
  });

  router.patch("/:id", perms("manage_tasks"), async (req, res) => {
    const { id } = req.params;
    console.log(id);
    const task = await db.task.findOne({ id: parseInt(id) });
    if (task == null) return res.status(400).json({ error: "No such task." });
    console.log(task);
    task.completed = true;
    console.log(task.completed);
    automation.runEvent("taskcompleted", {
      id: task.id,
      username: await cacheEngine.fetchusername(req.session.userid),
      name: task.name,
      details: task.description,
    });
    await task.save();
    res.json({ success: true });
  });
  return router;
};
module.exports = erouter;
