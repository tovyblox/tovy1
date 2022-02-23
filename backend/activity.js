const db = require('./db/db');
const noblox = require('noblox.js');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

let activews = [];

const erouter = (usernames, pfps, settings) => {
    router.ws('/socket', (ws, req) => {
        console.log(req.session)
        if (!req.session.userid) {
            ws.close();
            console.log('[-] Socket closing')
            return;
        }

        ws.send(JSON.stringify({
            type: 'init',
            message: 'connected to web'
        }));

        activews.push(ws);
        ws.on('close', () => {
            console.log('[-] Socket closed due to inactivity')
            activews.splice(activews.indexOf(ws), 1);
        });
    });

    router.post('/createsession', async (req, res) => {
        if (req.headers.authorization !== settings.activity.key) return res.status(401);
        if (settings.activity.role) {
            let userrank = await noblox.getRankInGroup(settings.group, parseInt(req.body.userid)).catch(err => null);
            if (!userrank) return res.status(200).json({ message: 'User is not high enough rank!' });
            if (userrank < settings.activity.role) {
                return res.status(200).json({ message: 'User is not high enough rank!' });
            }
        }
        let session = await db.session.findOne({ uid: parseInt(req.body.userid), active: true });

        if (session) return res.status(400).json({ message: 'Active session!!' });
        let userinfo = await noblox.getPlayerInfo(parseInt(req.body.userid))
        await db.session.create({
            active: true,
            start: new Date(),
            uid: parseInt(req.body.userid)
        });
        let fpfp = await fetchpfp(parseInt(req.body.userid))

        activews.forEach(ws => {
            ws.send(JSON.stringify({
                type: 'playadd',
                data: {
                    uid: parseInt(req.body.userid),
                    pfp: fpfp,
                    username: userinfo.username,
                }
            }))
        })

        res.status(200).json({ message: 'Successfully created session!' });
    });

    router.get('/ias/unaprooved', async (req, res) => {
        if (!checkperms(req.session.userid, 'manage_notices')) {
            return res.status(401).json({ message: 'Not logged in' });
        };

        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let ias = await db.ia.find({ status: 'none' });
        let s = [];
        for (ia of ias) {
            let e = ia.toObject()
            let username = await fetchusername(ia.uid);
            e.username = username;
            s.push(e)
            if (ias.indexOf(ia) == ias.length - 1) {
                res.status(200).json({ message: 'Successfully fetched unaprooved ias!', ias: s });
            }
        }

    })

    router.get('/ias/deny/:id', async (req, res) => {
        if (!checkperms(req.session.userid, 'manage_notices')) {
            return res.status(401).json({ message: 'Not logged in' });
        };

        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let ia = await db.ia.findOne({ status: 'none', id: parseInt(req.params.id) });
        if (!ia) return res.status(400).json({ message: 'No such ia!' });
        ia.status = 'denied';
        await ia.save();

        res.status(200).json({ message: 'Successfully denied ia!' });

    });

    router.get('/ias/accept/:id', async (req, res) => {
        if (!checkperms(req.session.userid, 'manage_notices')) {
            return res.status(401).json({ message: 'Not logged in' });
        };
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let ia = await db.ia.findOne({ status: 'none', id: parseInt(req.params.id) });
        if (!ia) return res.status(400).json({ message: 'No such ia!' });
        ia.status = 'accepted';
        await ia.save();

        res.status(200).json({ message: 'Successfully denied ia!' });

    });

    router.post('/endsession', async (req, res) => {
        if (req.headers.authorization !== settings.activity.key) return res.status(401)
        let session = await db.session.findOne({ uid: parseInt(req.body.userid), active: true });

        if (!session) return res.status(400).json({ message: 'No active session found!' });
        session.end = new Date();
        session.active = false;
        await session.save();

        activews.forEach(ws => {
            ws.send(JSON.stringify({
                type: 'playrm',
                data: {
                    uid: parseInt(req.body.userid),
                }
            }))
        });

        res.status(200).json({ message: 'Successfully ended session!' });
    });

    router.get('/activity/@me', async (req, res) => {
        let userid = req.session.userid;

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
        let ias = await db.ia.find({ uid: userid })
        ias = [...ias].map(e => {
            return { ...e._doc, type: 'IA' }
        })
        let d = [...sessions, ...ias];
        res.status(200).json({ sessions: d });
    });

    router.post('/createia', async (req, res) => {
        if (!checkperms(req.session.userid, '')) {
            return res.status(401).json({ message: 'Not logged in' });
        };

        let userid = req.session.userid;

        if (!userid) return res.status(401).json({ message: 'Get out!' });
        let dcount = await db.ia.countDocuments({});
        let dataarray = req.body.date.sort((a, b) => a - b);
        let data = {
            start: dataarray[0],
            end: dataarray[1],
            uid: userid,
            id: dcount,
            status: 'none',
            reason: req.body.r
        }
        let ia = await db.ia.create(data);

        res.status(200).json({ message: 'Successfully created ia!', data: data });
    })

    router.get('/best', async (req, res) => {
        if (!checkperms(req.session.userid, 'view_staff_activity')) {
            return res.status(401).json({ message: 'Not logged in' });
        };

        let sessions = await db.session.find({});
        if (!sessions.length) return res.status(200).json([]);
        let e = _.groupBy(sessions, (i => i.uid));
        let arr = Object.values(e).map(c => ({ uid: c[0].uid, l: c.length }))
        let sorted = arr.sort((a, b) => b.l - a.l).slice(0, 10);
        let s = [];
        for (user of sorted) {
            let uname = await fetchusername(user.uid)
            let pfp = await fetchpfp(user.uid);
            user.pfp = pfp;
            user.username = uname;
            s.push(user)
            if (sorted.indexOf(user) == sorted.length - 1) {
                res.status(200).json(s);
            }
        }
    });

    router.get('/activityinfo', async (req, res) => {
        if (!checkperms(req.session.userid, 'view_staff_activity')) {
            return res.status(401).json({ message: 'Not logged in' });
        };

        let sessions = await db.session.find({ active: true });
        if (!sessions.length) return res.status(200).json([]);
        let s = [];

        for (session of sessions) {
            let e = session.toObject();
            let userinfo = await noblox.getPlayerInfo(session.uid);
            let pfp = await fetchpfp(session.uid);
            e.pfp = pfp;
            e.username = userinfo.username;
            s.push(e)
            if (sessions.indexOf(session) == sessions.length - 1) {
                res.status(200).json(s);
            }
        }
    });

    router.get('/stats', async (req, res) => {
        if (!checkperms(req.session.userid, 'view_staff_activity')) {
            return res.status(401).json({ message: 'Not logged in' });
        };

        let sessions = await db.session.find({});
        let e = _.groupBy(sessions, (i => i.uid));
        let arr = sessions.map(e => {
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
        let sorted = arr.sort((a, b) => b.l - a.l).slice(0, 10);
        let s = [];
        let grouped = _.groupBy(sorted, (i => i.uid));

        res.status(200).json({
            staff: Object.keys(grouped).length,
            sessions: arr.length,
            mins: Math.floor(_.sumBy(arr, (i => i.time)))
        })
    });

    router.get('/off', async (req, res) => {
        if (!checkperms(req.session.userid, 'view_staff_activity')) {
            return res.status(401).json({ message: 'Not logged in' });
        };

        if (!req.session.userid) {
            return res.status(401).json({ message: 'Not logged in' });
        };

        let e = await db.ia.find({
            end: { $gte: Date.now() },
            start: { $lte: Date.now() },
            status: 'accepted'
        });
        let s = [];

        for (ia of e) {
            let g = ia.toObject()
            let uname = await fetchusername(ia.uid)
            let pfp = await fetchpfp(ia.uid);
            g.pfp = pfp;
            g.username = uname;
            s.push(g)
            if (e.indexOf(ia) == e.length - 1) {
                res.status(200).json(s);
            }
        }
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
}

module.exports = erouter;
