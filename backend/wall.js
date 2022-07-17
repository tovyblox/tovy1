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



const erouter = (cacheEngine, settings, permissions, automation) => {
    console.log('running')
    let perms = permissions.perms;
    let checkPerm = permissions.checkPerm

    noblox.onShout(parseInt(settings.get('group'))).on('error', err => {}).on('data', async (data) => {
        console.log('New shout');
        if (!settings.get('wall')?.sync) return;
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

        let pfp = await cacheEngine.fetchpfp(dbata.author);
        let username = await cacheEngine.fetchusername(dbata.author);
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
        if (!settings.get('wall')?.discordhook) return;
        let webhook = settings.get('wall').discordhook;

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

    router.ws('/socket', async (ws, req) => {
        let cp = await checkPerm(req.session.userid);
        
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

    router.get('/messages', perms(), async (req, res) => {
        let messages = await db.message.find({ deleted: false }).sort({ date: -1 });

        let u = await Promise.all(messages.map(async m => {
            let d = m._doc;
            let p = await cacheEngine.fetchpfp(d.author);
            let u = await cacheEngine.fetchusername(d.author)
            return {
                ...d,
                pfp: p,
                username: u
            }
        }));

        res.send(u);
    });

    router.post('/delete',perms('admin'), async (req, res) => {
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

    router.post('/send',perms('post_on_wall'), async (req, res) => {
        const { message, shout } = req.body;
        console.log(await db.message.countDocuments({}))
        let id = parseInt(await db.message.countDocuments({}));

        let data = {
            id: id + 1,
            author: req.session.userid,
            message: message,
            date: Date.now(),
            deleted: false
        };

        await db.message.create(data);

        let pfp = await cacheEngine.fetchpfp(data.author);
        let username = await cacheEngine.fetchusername(data.author);
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

    

    

    return router;
}

module.exports = erouter