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
    console.log('running');

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