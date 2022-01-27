const db = require('./db/db');
const noblox = require('noblox.js');
const bcrypt = require('bcrypt');
const fs = require('fs')
const path = require('path')
const _ = require('lodash');
const express = require('express');
const router = express.Router();

const erouter = (usernames, pfps, settings) => {
    router.post('/settings/adduser', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        const robloxusername = await noblox.getIdFromUsername(req.body.username).catch(() => {
            res.status(400).json({ message: 'No such roblox user!' });
        });
        if (!robloxusername) return;
        const finduser = await db.user.findOne({ userid: parseInt(robloxusername) });
        if (finduser) {
            finduser.role = 1;
        } else {
            await db.user.create({
                userid: parseInt(robloxusername),
                role: 1
            });
        }

        res.status(200).json({ message: 'Successfully added user!', uid: robloxusername });
    });



    router.get('/settings/users', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let users = await db.user.find({});
        let s = [];
        for (u of users) {
            let e = u.toObject();
            let username = await fetchusername(u.userid);
            e.passwordhash = undefined;
            e._id = undefined;
            e.username = username;
            s.push(e)
            if (users.indexOf(u) == users.length - 1) {
                res.status(200).json({ message: 'Successfully fetched unaprooved ias!', users: s });
            }
        }
    });

    router.post('/settings/updateuserroles', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let user = await db.user.findOne({ userid: parseInt(req.body.userid) });
        if (!user) return res.status(400).json({ message: 'No such user!' });
        if (req.body.role == 'delete') {
            user.role = undefined;
            await user.save();
            res.status(200).json({ message: 'Successfully updated user!' });
            return;
        }
        if (!settings.roles.find(r => r.id == req.body.role)) return res.status(400).json({ message: 'No such role!' });

        user.role = parseInt(req.body.role);
        await user.save();

        res.status(200).json({ message: 'Successfully updated user!' });
    });

    router.post('/settings/setpolicy', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        const config = await db.config.findOne({ name: 'noticetext' });
        if (config) {
            config.value = req.body.text;
            config.save();
        } else {
            await db.config.create({
                name: 'noticetext',
                value: req.body.text
            });
        }

        settings.noticetext = req.body.text;

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/settings/setproxy', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        const config = await db.config.findOne({ name: 'wproxy' });
        if (config) {
            config.value = req.body.enabled;
            config.save();
        } else {
            await db.config.create({
                name: 'wproxy',
                value: req.body.enabled
            });
        }

        settings.proxy = req.body.enabled;

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/settings/resetactivity', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'manage_staff_activity');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        await db.session.deleteMany({ active: false });
        
        res.status(200).json({ message: 'Updated!' });
    });

    router.get('/settings/other', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        const config = await db.config.find({});
        if (!config) return res.status(400).json({ message: 'No config!' });
        let c = {
            noticetext: config.find(c => c.name == 'noticetext'),
            role: settings.activity.role,
            proxy: settings.proxy
        }
        res.status(200).json({ message: 'Successfully fetched config!', config: c });
    })

    router.get('/settings/roles', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        const config = await db.config.findOne({ name: 'roles' });

        if (!config) return res.status(400).json({ message: 'No roles found!' });
        res.status(200).json({ message: 'Successfully fetched roles!', roles: config.value });
    })

    router.get('/settings/invites', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        const config = await db.config.findOne({ name: 'invites' });

        if (!config) return res.status(400).json({ message: 'No invites found!' });
        res.status(200).json({ message: 'Successfully fetched invites!', invites: config.value });
    })

    router.post('/settings/updateroles', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let config = await db.config.findOne({ name: 'roles' });
        settings.roles = req.body.roles;
        if (config) {
            config.value = req.body.roles;
            await config.save();
        } else {
            db.config.create({
                name: 'roles',
                value: req.body.roles
            });
        };

        res.status(200).json({ message: 'Successfully updated roles!' });
    });

    router.post('/settings/updateinvites', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let cf = await db.config.findOne({ name: 'invites' });
        let invites = req.body.invites;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
        for (invite of invites) {
            if (invite.code) continue;
            invite.code = chooseRandom(letters, 12).join('')
        };
        if (cf) {
            cf.value = invites;
            await cf.save();
        } else {
            db.config.create({
                name: 'invites',
                value: invites
            });
        };

        res.status(200).json({ message: 'Successfully updated invites!', invites: invites });
    });

    router.post('/settings/newinvite', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let cd = await db.config.findOne({ name: 'invites' });
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

        let zz = {
            role: 1,
            code: chooseRandom(letters, 12).join('')
        }

        if (cd) {
            let e = cd.value;
            cd.value = [...e, zz];
            await cd.save();
        } else {
            let invites = [zz];
            db.config.create({
                name: 'invites',
                value: invites
            });
        };

        res.status(200).json({ message: 'Successfully updated invites!', invite: zz });
    });

    router.get('/group/roles', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        let group = settings.group;

        let roles = await noblox.getRoles(group)
        res.status(200).json({ message: 'Successfully fetched roles!', roles: roles, currole: settings.activity.role });
    });

    router.post('/settings/setgrouprole', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let curconfig = await db.config.findOne({ name: 'activity' });

        curconfig.value = {
            key: curconfig.value.key,
            role: req.body.role
        }
        
        settings.activity = {
            key: curconfig.value.key,
            role: req.body.role
        }

        curconfig.save().catch(err => console.log(err)).then(() => console.log('saved'));

        res.status(200).json({
            message: 'ok'
        })
    })



    router.post('/settings/setcolor', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let curcolor = await db.config.findOne({ name: 'color' });
        if (!curcolor) {
            await db.config.create({
                name: 'color',
                value: req.body.color
            });
            return res.status(200).json({ message: 'ok' })
        };

        curcolor.value = req.body.color;
        curcolor.save()

        res.status(200).json({
            message: 'ok'
        })
    });

    router.get('/settings/loader', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let xml_string = fs.readFileSync(path.join(__dirname, 'Script.rbxmx'), "utf8");
        res.setHeader('Content-Disposition', 'attachment; filename=tovy_activity.rbxmx');
        let xx = xml_string.replace('<api>', settings.activity.key).replace('<ip>', `http://${req.headers.host}/api`);

        res.type('rbxmx')
        res.send(xx);
    })

    async function fetchusername(uid) {
        if (usernames.get(uid)) {
            return usernames.get(uid);
        }
        let userinfo = await noblox.getUsernameFromId(uid);
        usernames.set(parseInt(uid), userinfo, 10000);

        return userinfo;
    }

    function chooseRandom(arr, num) {
        const res = [];
        for (let i = 0; i < num;) {
            const random = Math.floor(Math.random() * arr.length);
            if (res.indexOf(arr[random]) !== -1) {
                continue;
            };
            res.push(arr[random]);
            i++;
        };
        return res;
    }

    async function fetchpfp(uid) {
        if (pfps.get(uid)) {
            return pfps.get(uid);
        }
        let pfp = await noblox.getPlayerThumbnail({ userIds: uid, cropType: "headshot" });
        pfps.set(parseInt(uid), pfp[0].imageUrl, 10000);

        return pfp[0].imageUrl
    }

    async function checkperms(uid, perm) {
        let roles = settings.roles;
        let user = await db.user.findOne({ userid: parseInt(uid) });
        if (!user) return false;
        if (user.role == null || user.role == undefined) return false;
        if (user.role == 0) return true;
        let role = roles.find(r => r.id == user.role);
        if (!role) return false;
        return role.permissions.includes(perm);
    }

    return router;
};

module.exports = erouter;

