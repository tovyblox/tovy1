const db = require('./db/db');
const noblox = require('noblox.js');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

let activews = [];

const erouter = (usernames, pfps, settings) => {
    router.get('/group/members', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'manage_staff_activity');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        if (!req.query.role) {
            res.status(200).json({ message: 'No role specified' });
            return;
        }
        let role = await noblox.getRole(settings.group, parseInt(req.query.role)).catch(err => {
            res.status(400).json({ message: 'No such role!' })
            return null;
        });
        if (!role) return;
        let members = await noblox.getPlayers(settings.group, role.id).catch(err => res.status(500).json({ message: 'Server error!' }));;
        let mx = await Promise.all(members.map(async m => {
            m.pfp = await fetchpfp(m.userId);
            m.selected = false;
            return m;
        }));
        console.log(mx)

        res.status(200).json({ members: await mx });
    });

    router.get('/uprofile/:user', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'manage_staff_activity');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        let user = parseInt(req.params.user);
        let ruser = await noblox.getPlayerInfo(user)

        res.status(200).json({
            username: ruser.username,
            info: ruser,
            pfp: await fetchpfp(user),
        })
    })

    router.get('/pactivity/:user', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'manage_staff_activity');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        let userid = parseInt(req.params.user);

        if (!userid) return res.status(401).json({ message: 'Get out!' });
        let sessions = await db.session.find({ uid: userid, active: false });
        sessions = [...sessions].map(e => {
            let time;
            if (!e.mins) {
                const d2 = new Date(e.start);
                const d1 = new Date(e.end);
                const diffMs = d1.getTime() - d2.getTime();
                const diffMins = (diffMs / 1000) / 60;
                time = Math.round(diffMins);
            } else time = e.mins;

            return { ...e._doc, time: time, type: e.type || 'session' }
        });
        console.log(sessions)
        let ias = await db.ia.find({ uid: userid })
        ias = [...ias].map(e => {
            return { ...e._doc, type: 'IA' }
        })
        let d = [...sessions, ...ias].sort((a, b) => b.start - a.start);



        res.status(200).json({ sessions: d, stats: {
            ia: ias.length,
            session: sessions.length,
            mins: Math.round(_.sumBy(sessions, 'time'))
        } });
    });



    router.post('/mactivity/change', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'manage_staff_activity');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        let mins = parseInt(req.body.mins);
        let type = req.body.type;

        if (!mins) return res.status(400).json({ message: 'No minutes specified' });
        if (type !== 'remove' && type !== 'add') return res.status(400).json({ message: 'Invalid type' });
        req.body.users.forEach(async u => {
            await db.session.create({
                active: false,
                mins: req.body.type === 'remove' ? -mins : mins,
                uid: u,
                start: new Date(),
                type: req.body.type
            })
        });

        res.status(200).json({ message: 'Successfully changed activity' });
    })

    router.post('/mactivity/reset', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'manage_staff_activity');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        
        req.body.users.forEach(async u => {
            await db.session.deleteMany({ active: false, uid: parseInt(u) });
        });

        res.status(200).json({ message: 'Successfully changed activity' });
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
        let pfp = await noblox.getPlayerThumbnail({ userIds: uid, cropType: "headshot" }).catch(err => null);
        if (!pfp) return null;
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
}

module.exports = erouter;
