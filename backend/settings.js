const db = require('./db/db');
const noblox = require('noblox.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs')
const path = require('path')
const _ = require('lodash');
const express = require('express');
let package = require('../package.json');
const axios = require('axios')
const router = express.Router();

const erouter = (usernames, pfps, settings, permissions) => {
    let perms = permissions.perms;
    let checkPerm = permissions.checkPerm

    router.post('/adduser', perms('admin'), async (req, res) => {
        if (!req.body?.username) return res.status(400).send({ success: false, message: 'No username provided' });
        if (typeof req.body.username !== 'string') return res.status(400).send({ success: false, message: 'Username must be a string' });
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



    router.get('/users', perms('admin'), async (req, res) => {
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

    router.get('/checkupdates', perms('admin'), async (req, res) => {
        let red;
        try {
            red = await axios.get('https://bot.tovyblox.xyz/changes/latestupdate');
        } catch(e) {
            return res.status(200).json({ updates: false });
        }

        let ver = parseFloat(package.version.split('.').slice(0, 2).join('.'));
        if (ver >= red.data.version) return res.status(200).json({ updates: false });
        return res.status(200).json({ updates: true, ...red.data });
    })

    router.post('/setcookie', perms('admin'),  async (req, res) => {
        if (!req.body?.cookie) return res.status(400).json({ success: false, message: 'No cookie previded' });
        if (typeof req.body.cookie !== 'string') return res.status(400).json({ success: false, message: 'Cookie must be a string' });
        const { cookie } = req.body;

        let user;

        try {
            user = await noblox.setCookie(cookie);

        } catch (e) {
            res.status(400).json({ message: 'Invalid cookie!' });
            return;
        };

        let pfp = await fetchpfp(user.UserID)
        // generate random hex with crypto
        let hash = crypto.randomBytes(20).toString('hex');
        settings.set('ranking', { 
            cookie: cookie,
            hash
        });

        settings.settings.ranking =    {
            username: user.UserName,
            uid: user.UserID,
            pfp,
            apikey: config.value.hash
        };
    

        res.status(200).json({ message: 'Successfully set cookie!', info: settings.get('ranking') });
    });


    router.post('/updateuserroles', perms('admin'),async (req, res) => {
        if (!req.body?.userid) return res.status(400).json({ success: false, message: 'No user previded' });
        if (typeof req.body.userid !== 'number') return res.status(400).json({ success: false, message: 'User must be a string' });
        let user = await db.user.findOne({ userid: parseInt(req.body.userid) });
        if (!user) return res.status(400).json({ message: 'No such user!' });
        if (user.role == 0) return res.status(400).json({ message: 'No such user!' });
        if (req.body.role == 'delete') {
            user.role = undefined;
            await user.save();
            res.status(200).json({ message: 'Successfully updated user!' });
            return;
        }
        if (!settings.get('roles').find(r => r.id == req.body.role)) return res.status(400).json({ message: 'No such role!' });

        user.role = parseInt(req.body.role);
        await user.save();

        res.status(200).json({ message: 'Successfully updated user!' });
    });

    router.post('/setpolicy', perms('admin'), async (req, res) => {
        if (!req.body?.text) return res.status(400).json({ success: false, message: 'No policy previded' });
        if (typeof req.body.text !== 'string') return res.status(400).json({ success: false, message: 'Policy must be a string' });
        settings.set('noticetext', req.body.text)

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/setwall', perms('admin'), async (req, res) => {
        settings.set('wall', req.body.wall);
        const body = req.body;

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/setsessions', perms('admin'), async (req, res) => {
        const body = req.body;
        settings.set('sessions', body.settings)

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/setproxy', perms('admin'), async (req, res) => {
        if (req.body?.enabled == null) return res.status(400).json({ success: false, message: 'No enabled previded' });
        if (typeof req.body.enabled !== 'boolean') return res.status(400).json({ success: false, message: 'Enabled must be a string' });
        settings.set('wproxy', req.body.enabled);

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/resetactivity', perms('admin'), async (req, res) => {
        await db.session.deleteMany({ active: false });

        res.status(200).json({ message: 'Updated!' });
    });

    router.get('/other', perms('admin'),  async (req, res) => {
        const config = await db.config.find({});
        if (!config) return res.status(400).json({ message: 'No config!' });
        let c = {
            noticetext: settings.get('noticetext'),
            role: settings.get('activity')?.role,
            proxy: settings.get('wproxy'),
            ranking: settings.get('ranking'),
            wall: settings.get('wall'),
            sessions: settings.get('sessions'),
            groupgames: await noblox.getGroupGames(settings.get('group'), "Public")
        }
        res.status(200).json({ message: 'Successfully fetched config!', config: c });
    })

    router.get('/roles', perms('admin'), async (req, res) => {
        const config = await settings.get('roles');

        if (!config) return res.status(400).json({ message: 'No roles found!' });
        res.status(200).json({ message: 'Successfully fetched roles!', roles: config });
    })

    router.get('/invites', perms('admin'), async (req, res) => {
        const config = await settings.get('invites');

        if (!config) return res.status(400).json({ message: 'No invites found!' });
        res.status(200).json({ message: 'Successfully fetched invites!', invites: config });
    })

    router.post('/updateroles', perms('admin'), async (req, res) => {
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let config = await db.config.findOne({ name: 'roles' });
        settings.set('roles', req.body.roles);

        res.status(200).json({ message: 'Successfully updated roles!' });
    });

    router.post('/updateinvites', perms('admin'), async (req, res) => {
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let cf = await db.config.findOne({ name: 'invites' });
        let invites = req.body.invites;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
        for (invite of invites) {
            if (invite.code) continue;
            invite.code = chooseRandom(letters, 12).join('')
        };
        settings.set('invites', invites);

        res.status(200).json({ message: 'Successfully updated invites!', invites: invites });
    });

    router.post('/newinvite', perms('admin'), async (req, res) => {
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let cd = settings.get('invites')
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

        let zz = {
            role: 1,
            code: chooseRandom(letters, 12).join('')
        }

        if (cd) {
            let e = cd;
            settings.set('invites', [...e, zz]);
        } else {
            let invites = [zz];
            settings.set('invites', invites);

        };

        res.status(200).json({ message: 'Successfully updated invites!', invite: zz });
    });

    router.get('/groles', async (req, res) => {
        let cp = await checkPerm(req.session.userid, 'manage_staff_activity');
        let othercp = await checkPerm(req.session.userid, 'admin');

        if (!othercp && !cp) return res.status(401).json({ message: 'go away!' });

        let group = settings.get('group');

        let roles = await noblox.getRoles(group)
        res.status(200).json({ message: 'Successfully fetched roles!', roles: roles, currole: settings.get('activity').role });
    });

    router.post('/setgrouprole', perms('admin'), async (req, res) => {
        let curconfig = settings.get('activity');
        settings.set('activity', {
            key: curconfig.key,
            role: req.body.role
        })

        res.status(200).json({
            message: 'ok'
        })
    })



    router.post('/setcolor', perms('admin'), async (req, res) => {
        if (!req.body?.color) return res.status(400).json({ success: false, message: 'No color previded' });
        if (typeof req.body.color !== 'string') return res.status(400).json({ success: false, message: 'Colored must be a string' });
        settings.set('color', req.body.color);

        res.status(200).json({
            message: 'ok'
        })
    });

    router.get('/loader', perms('admin'), async (req, res) => {
        let xml_string = fs.readFileSync(path.join(__dirname, 'Script.rbxmx'), "utf8");
        res.setHeader('Content-Disposition', 'attachment; filename=tovy_activity.rbxmx');
        let xx = xml_string.replace('<api>', settings.get('acivity').key).replace('<ip>', `http://${req.headers.host}/api`);

        res.type('rbxmx')
        res.send(xx);
    })

    router.get('/rloader', perms('admin'), async (req, res) => {
        let xml_string = fs.readFileSync(path.join(__dirname, 'Tovy_RankingLoader.rbxmx'), "utf8");
        res.setHeader('Content-Disposition', 'attachment; filename=Tovy_RankingLoader.rbxmx');
        let xx = xml_string.replace('<key>', settings.get('ranking').apikey).replace('<url>', `http://${req.headers.host}/api/ranking`);

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

    return router;
};

module.exports = erouter;

