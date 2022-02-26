const db = require('./db/db');
const noblox = require('noblox.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs')
const path = require('path')
const _ = require('lodash');
const express = require('express');
const discord = require('discord.js');
let package = require('../package.json');
const axios = require('axios')
const router = express.Router();



let activews = [];



const erouter = (usernames, pfps, settings) => {
    console.log('running');

    router.use((req, res, next) => {
        if (!settings?.sessions?.enabled) {
            return res.status(403).send('Forbidden');
        }
        next()
    });

    setInterval(async () => {
        let essions = await db.gsession.find({ started: false, start: { $lt: new Date() } });
        console.log(essions);
        essions.forEach(async (session) => {
            let ssession = await db.gsession.findOne({ id: session.id });
            ssession.started = true;
            console.log(ssession);
            ssession.did = await sendlog(session);
            await ssession.save();
        });

    }, 10000)

    async function sendlog(data) {
        if (!settings.sessions?.discohook) return null;
        console.log('sending')
        let webhook = settings.sessions.discohook;

        let webhookc = new discord.WebhookClient({ url: webhook });
        let username = await fetchusername(data.uid);
        let pfp = await fetchpfp(data.uid);

        let embed = new discord.MessageEmbed()
            .setTitle(`${data.type.name} is now being hosted and will commence shortly!`)
            .setColor('GREEN')
            .setTimestamp()
            .setAuthor(username, pfp, `https://www.roblox.com/users/${data.uid}`)
            .setDescription(`A ${data.type.name} is now being hosted by ${username}! Join the game below to attend this session.`)
            .addField('Gamelink', `https://www.roblox.com/games/${data.type.gid}/-`, true)
            .setImage(data.thumbnail)
            .setFooter({ text: `Tovy Sessions` });

        let components = new discord.MessageActionRow()
            .addComponents(
                new discord.MessageButton({ style: 'LINK', label: 'Join', url: `https://www.roblox.com/games/${data.type.gid}/-` })
            );
        
        console.log(settings.sessions.discoping)


        let msg = await webhookc.send({ content: settings.sessions.discoping.length ? settings.sessions.discoping : null, embeds: [embed], components: [components] });
        console.log(msg.id)
        return msg.id;
    }

    async function unsendlog(data) {
        if (!settings.sessions?.discohook) return null;
        if (!data?.did) return null;
        console.log('editing')

        let webhook = settings.sessions.discohook;

        let webhookc = new discord.WebhookClient({ url: webhook });
        let username = await fetchusername(data.uid);
        let pfp = await fetchpfp(data.uid);

        let embed = new discord.MessageEmbed()
            .setTitle(`${data.type.name} ended`)
            .setColor('RED')
            .setTimestamp()
            .setAuthor(username, pfp, `https://www.roblox.com/users/${data.uid}`)
            .setDescription(`The ${data.type.name} hosted by ${username} has ended! We will host more very soon don't worry`)
            .setFooter({ text: `Tovy sessions` });


        let msg = await webhookc.editMessage(data.did, { content: null, embeds: [embed], components: [] }).catch(err => {
            console.log(err)
        });
        return msg.id;
    }

    router.post('/session/end', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'host_sessions');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let session = await db.gsession.findOne({ id: req.body.id });
        if (!session) res.status(404).send('Session not found');

        session.end = new Date();
        session.save();

        await unsendlog(session);

        res.status(200).send({ success: true });
    });

    router.get('/session/:id', async (req, res) => {
        let session = await db.gsession.findOne({ id: req.params.id });
        if (!session) return res.status(404).send({ success: false, error: 'Session not found' });
        console.log(session)

        let data = {
            ...session._doc,
            user: {
                username: await fetchusername(session.uid),
                pfp: await fetchpfp(session.uid),
            },
        };
        res.send({ success: true, data });
    })

    router.get('/sessions', async (req, res) => {
        let sessions = await db.gsession.find({});
        let mx = await Promise.all(sessions.map(async m => {
            return {
                ...m._doc,
                user: {
                    username: await fetchusername(m.uid),
                    pfp: await fetchpfp(m.uid),
                },
            };
        }));
        res.status(200).send(mx);
    })

    //session db is db.gsession
    router.get('/games', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'host_sessions');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        let games = settings.sessions.games;
        let game = await noblox.getUniverseInfo(games.map(m => m.id))

        res.send(games.map(m => {
            let e = game.find(f => f.id == m.id);
            return {
                type: m.type,
                id: m.id,
                gameinfo: {
                    name: e?.name,
                    description: e?.description,
                }
            }
        }));
    });

    router.post('/hostsession', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'host_sessions');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        let data = req.body;
        let id = parseInt(await db.gsession.countDocuments({}));
        let treq = await axios.get(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${req.body.game}&size=768x432&format=Png&isCircular=false`);
        let thumbnail = treq.data.data[0]?.thumbnails[0]?.imageUrl;
        console.log(data)
        let ginfo = await noblox.getUniverseInfo(req.body.type);
        let dbdata = {
            id: id + 1,
            start: data.date || Date.now(),
            uid: req.session.userid,
            thumbnail,
            started: data.now,
            type: {
                id: req.body.type,
                name: settings.sessions.games.find(f => f.id == req.body.type)?.type,
                gname: ginfo[0].name,
                gid: ginfo[0].rootPlaceId,
            },
        };
        if (data.now) dbdata.did = await sendlog(dbdata);
        console.log(dbdata.did)

        await db.gsession.create(dbdata);

        //let webhook = new WebhookClient()

        res.send({
            ...dbdata,
            user: {
                username: await fetchusername(req.session.userid),
                pfp: await fetchpfp(req.session.userid),
            },
        })
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

module.exports = erouter