const db = require('./db/db');
const noblox = require('noblox.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs')
const path = require('path')
const _ = require('lodash');
const express = require('express');
const { WebhookClient, MessageEmbed } = require('discord.js');
let package = require('../package.json');
const axios = require('axios')
const router = express.Router();



let activews = [];



const erouter = (usernames, pfps, settings) => {
    console.log('running')
    noblox.onShout(parseInt(settings.group)).on('error', err => {}).on('data', async (data) => {
        console.log(data);
        if (!settings.sync) return;
        let id = parseInt(await db.message.countDocuments({}));


        let dbata = {
            id: id + 1,
            author: data.poster.userId,
            message: data.body,
            date: Date.now(),
            deleted: false,
            shout: true
        };

        await db.message.create(dbata);

        let pfp = await fetchpfp(dbata.author);
        let username = await fetchusername(dbata.author);
        sendlog(dbata, username, pfp);
        let send = {
            ...dbata,
            pfp: pfp,
            username: username,
        };
        activews.forEach(ws => {
            ws.send(JSON.stringify({
                type: 'send',
                data: send
            }));
        });
    })

    function sendlog(data, username, pfp) {
        if (!settings.wall.discordhook) return;
        let webhook = settings.wall.discordhook;

        let webhookc = new WebhookClient({ url: webhook });

        let embed = new MessageEmbed()
            .setTitle('New Tovy Wall Post')
            .setColor('GREEN')
            .setTimestamp()
            .setAuthor(username, pfp, `https://www.roblox.com/users/${data.author}`)
            .setDescription(data.message)
            .setFooter({ text: `${data.shout ? 'Group shout' : ''}`})

        webhookc.send({ embeds: [embed] })
    }

    router.ws('/wall/socket', async (ws, req) => {
        console.log(req.session)
        let cp = await checkperms(req.session.userid);
        
        if (!cp) {
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

    router.get('/wall/messages', async (req, res) => {
        let cp = await checkperms(req.session.userid);
        if (!cp) return res.status(401).json({ message: 'go away!' });
        let messages = await db.message.find({ deleted: false }).sort({ date: -1 });

        let u = await Promise.all(messages.map(async m => {
            let d = m._doc;
            let p = await fetchpfp(d.author);
            let u = await fetchusername(d.author)
            return {
                ...d,
                pfp: p,
                username: u
            }
        }));

        res.send(u);
    });

    router.post('/wall/delete', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'admin');
        if (!cp) return res.status(401).json({ message: 'go away!' });
        const { id } = req.body;
        let message = await db.message.findOne({ id: id });

        if (!message) res.status(404).send('Message not found');

        message.deleted = true;
        await message.save();

        activews.forEach(ws => {
            ws.send(JSON.stringify({
                type: 'delete',
                data: { id, actor: req.session.userid }
            }));
        });
        res.send({ success: true });
    })

    router.post('/wall/send', async (req, res) => {
        let cp = await checkperms(req.session.userid, 'post_on_wall');
        if (!cp) return res.status(401).json({ message: 'go away!' });

        const { message, shout } = req.body;
        console.log(req.body);
        console.log(await db.message.countDocuments({}))
        let id = parseInt(await db.message.countDocuments({}));
        console.log(id)

        let data = {
            id: id + 1,
            author: req.session.userid,
            message: message,
            date: Date.now(),
            deleted: false
        };

        await db.message.create(data);

        let pfp = await fetchpfp(data.author);
        let username = await fetchusername(data.author);
        sendlog(data, username, pfp);
        let send = {
            ...data,
            pfp: pfp,
            username: username,
        }
        activews.forEach(ws => {
            ws.send(JSON.stringify({
                type: 'send',
                data: send
            }));
        });


        res.status(200).send({
            success: true,
            msg: send
        })
    });

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
        if (!perm) return true;
        return role.permissions.includes(perm);
    }

    return router;
}

module.exports = erouter