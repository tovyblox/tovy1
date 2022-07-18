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



const erouter = (cacheEngine, settings) => {
    router.use((req, res, next) => {
        if (req.headers['api'] !== settings.get('ranking').apikey) return res.status(401).send('Unauthorized');
        next();
    });

    router.get('/', (req, res) => {
        res.send({ success: true, message: 'Good to go' });
    })

    router.post('/setrank', async (req, res) => {
        if (!req.body.rank) return res.status(400).send({ success: false, message: 'No rank provided'});
        if (!req.body.user) return res.status(400).send({ success: false, message: 'No user provided'});

        try {
            await noblox.setRank(settings.get('group'), req.body.user, req.body.rank);
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
            await noblox.promote(settings.get('group'), req.body.user);
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
            await noblox.demote(settings.get('group'), req.body.user);
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
            await noblox.shout(settings.get('group'), req.body.shout);
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

    return router;
}

module.exports = erouter