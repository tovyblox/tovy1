const db = require('./db/db');
const express = require('express');
const router = express.Router();  
const { fetchpfp, fetchusername } = require('./index');
const erouter = (usernames, pfps, settings, permissions, logging, automation) => {
    const perms = permissions.perms
    router.get('/task/:id', async (req, res) => {
        const { id } = req.params;
        const task = await db.task.findOne({ where: { id: id } });
        if (task == null) return res.status(400).json({ error: "No such task." });
        res.json({ task: task });
    });
    router.get('/@me', async (req, res) => {
        const userPerms = await db.user.findOne({ where: { id: req.session.userid } });
        let tasks = await db.task.find({});
        tasks = await Promise.all(tasks.map(async task => {
            let username = await fetchusername(task.author)
            let pfp = await fetchpfp(task.author)
            return {
                ...task._doc,
                pfp,
                username
            }
        }));
        const tasksToSend = [];
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (task.assignedUsers.includes(req.session.userid) || task.assignedRoles.includes(userPerms.role) || task.author == req.session.userid || perms.includes('admin') || task.completedUsers.includes(req.session.userid)) {
                tasksToSend.push(task);
            }
        }
        res.status(200).send(tasksToSend );
    })

    router.post('/create', perms('manage_tasks'), async (req, res) => {
        const { name, description, due, assignedRoles, assignedUsers, priority } = req.body;  
        if (!name) return res.status(400).json({ error: "No name provided." });
        if (!description) return res.status(400).json({ error: "No description provided." });
        if (!due) return res.status(400).json({ error: "No due date provided." });  
        let currentid = await db.task.countDocuments({})
        let taskdata = { name: name, description: description, createdAt: new Date(), due: due, id: currentid + 1, assignedRoles: assignedRoles, assignedUsers: assignedUsers, author: req.session.userid, creatorAvatar: pfps.get(req.session.userid), priority: priority }
        const task = await db.task.create(taskdata);  
        res.status(200).json({ success: true, task: taskdata });    
        logging.newLog(`has created a new task: **${name}**`, req.session.userid);
    })  

    router.post('/edit', perms('manage_tasks'), async (req, res) => {
        let { id, name, description, due, assignedRoles, assignedUsers } = req.body;
        const task = await db.task.findOne({ where: { id: id } });
        if (!task.assignedBy == req.session.userid) return res.status(400).json({ error: "You can't edit this task." });
        if (task == null) return res.status(400).json({ error: "No such task." });
        if (!id) return res.status(400).json({ error: "No id provided." });
        if (!name) name = task.name;
        if (!description) description = task.description;
        if (!due) due = task.due;
        if (!assignedRoles) assignedRoles = task.assignedRoles; 
        if (!assignedUsers) assignedUsers = task.assignedUsers; 
        await task.update({ name: name, description: description, due: due, assignedRoles: assignedRoles, assignedUsers: assignedUsers });
        res.status(200).json({ success: true, task: task });
        logging.newLog(`has edited a task: **${name}**`, req.session.userid);
    })

    router.post('/delete/:id', perms('manage_tasks'), async (req, res) => {
        const { id } = req.params;
        const task = await db.task.deleteOne({ where: { id: id } });  
        res.status(200).json({ success: true });
    })

    router.post('/complete', async (req, res) => {
        const { id } = req.body;
        const task = await db.task.findOne({ where: { id: id } });
        if (task == null) return res.status(400).json({ error: "No such task." });
        await task.completedUsers.push(req.session.userid);
        await task.save();
        res.json({ success: true, task: task });
    })
    return router
}
module.exports = erouter;