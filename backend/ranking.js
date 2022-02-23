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
    router.use((req, res, next) => {
        console.log(settings.ranking)
        if (req.headers['api'] !== settings.ranking.apikey) return res.status(401).send('Unauthorized');
        next();
    });

    router.post('/setrank', async (req, res) => {
        if (!req.body.rank) return res.status(400).send({ success: false, message: 'No rank provided'});
        if (!req.body.user) return res.status(400).send({ success: false, message: 'No user provided'});

        try {
            await noblox.setRank(settings.group, req.body.user, req.body.rank);
        } catch (e) {
            await db.ranklog.create({
                type: 'setrank',
                data: req.body,
                errored: true,
            });
            return res.status(500).send({ success: false, message: e.message });
        };
        await db.ranklog.create({
            type: 'setrank',
            data: req.body,
            errored: false,
        });

        res.send({
            success: true,
        })
    })

    router.post('/promote', async (req, res) => {
        if (!req.body.user) return res.status(400).send({ success: false, message: 'No user provided'});

        try {
            await noblox.promote(settings.group, req.body.user);
        } catch (e) {
            await db.ranklog.create({
                type: 'promote',
                data: req.body,
                errored: true,
            });
            return res.status(500).send({ success: false, message: e.message });
        };
        await db.ranklog.create({
            type: 'promote',
            data: req.body,
            errored: false,
        });

        res.send({
            success: true,
        })
    });

    router.post('/demote', async (req, res) => {
        if (!req.body.user) return res.status(400).send({ success: false, message: 'No user provided'});

        try {
            await noblox.demote(settings.group, req.body.user);
        } catch (e) {
            await db.ranklog.create({
                type: 'demote',
                data: req.body,
                errored: true,
            });
            return res.status(500).send({ success: false, message: e.message });
        };
        await db.ranklog.create({
            type: 'demote',
            data: req.body,
            errored: false,
        });

        res.send({
            success: true,
        })
    });

    router.post('/shout', async (req, res) => {
        if (!req.body.shout) return res.status(400).send({ success: false, message: 'No shout message provided'});
        try {
            await noblox.shout(settings.group, req.body.shout);
        } catch (e) {
            await db.ranklog.create({
                type: 'shout',
                data: req.body,
                errored: true,
            });
            return res.status(500).send({ success: false, message: e.message });
        };
        await db.ranklog.create({
            type: 'shout',
            data: req.body,
            errored: false,
        });

        res.send({
            success: true,
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