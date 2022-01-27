const argv = require('minimist')(process.argv.slice(2));
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express');
const app = express();
const db = require('./db/db');
const noblox = require('noblox.js');
const history = require('connect-history-api-fallback');
const ora = require('ora');
const fs = require('fs');
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
let backendonly = false;

if (argv['backend-only'] || argv.b) backendonly = true;
if (backendonly) {
    console.log('Running tovy on the backend')
}

const _ = require('lodash');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const NodeCache = require("node-cache");
const usernames = new NodeCache();
const pfps = new NodeCache();
const ews = require('express-ws')(app);
let activews = [];

let settings = {};


const cors = require('cors');
const { default: axios } = require('axios');
app.use(cors({
    credentials: true,
    origin: true
}));

app.use(bodyParser.json());


app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    domain: false,
    httpOnly: false
}));

(async () => {
    let configforgroup = await db.config.findOne({ name: 'group' });
    if (!configforgroup) return;
    settings.group = configforgroup.value;

    let configforactivity = await db.config.findOne({ name: 'activity' });
    settings.activity = configforactivity.value;

    let configforuser = await db.config.findOne({ name: 'roles' });
    if (configforuser) settings.roles = configforuser.value;

    let configfornotice = await db.config.findOne({ name: 'noticetext' });
    if (configfornotice) settings.noticetext = configfornotice.value;

    let configforproxy = await db.config.findOne({ name: 'wproxy' });
    if (configforproxy) settings.proxy = configforproxy.value;
})();

app.use('/api/', require('./activity')(usernames, pfps, settings));
app.use('/api/', require('./staff')(usernames, pfps, settings))

if (!backendonly) {
    let staticFileMiddleware = express.static(path.join(__dirname, '../dist'));

    app.use(history({
        rewrites: [
            {
                from: '/api/',
                to: function (context) {
                    return context.parsedUrl.pathname;
                }
            }
        ]
    }));
    app.use('/', staticFileMiddleware);
}

app.use('/api/', require('./settings')(usernames, pfps, settings));

app.post('/api/webhooks/:id/:secret', async (req, res) => {
    if (!settings.proxy) return res.status(500).send({ success: false, message: 'proxy not set' });
    await axios.post('https://discord.com/api/webhooks/' + req.params.id + '/' + req.params.secret, req.body).then(r => {
        res.send({
            success: true
        })
    }).catch(e => {
        res.status(e.response.status).send(e.response.data)
    })
})

app.patch('/api/webhooks/:id/:secret/messages/:msg', async (req, res) => {
    if (!settings.proxy) return res.status(500).send({ success: false, message: 'proxy not set' });
    await axios.patch(`https://discord.com/api/webhooks/${req.params.id}/${req.params.secret}/messages/${req.params.msg}`, req.body).then(r => {
        res.send(r.data)
    }).catch(e => {
        res.status(e.response.status).send(e.response.data)
    })
})

app.delete('/api/webhooks/:id/:secret/messages/:msg', async (req, res) => {
    if (!settings.proxy) return res.status(500).send({ success: false, message: 'proxy not set' });

    await axios.delete(`https://discord.com/api/webhooks/${req.params.id}/${req.params.secret}/messages/${req.params.msg}`, req.body).then(r => {
        res.send({
            success: true
        })
    }).catch(e => {
        res.status(e.response.status).send(e.response.data)
    })
})

app.post('/api/finishSignup', async (req, res) => {
    const hash = bcrypt.hashSync(req.body.password, 10);
    let uid = await noblox.getIdFromUsername(req.body.username)

    await db.user.create({
        userid: uid,
        passwordhash: hash,
        role: 0
    });

    req.session.userid = uid;

    await db.config.create({
        name: 'group',
        value: req.body.group
    });

    let a = {
        key: chooseRandom(letters, 18).join(''),
        role: null
    }

    await db.config.create({
        name: 'activity',
        value: a
    });
    settings.activity = a;
    settings.group = req.body.group;
    res.status(200).json({ message: 'Successfully created user!' });
});

/**
 * @param {wss} ws
 
 */

app.get('/api/profile', async (req, res) => {
    if (!await db.config.findOne({ name: 'group' })) return res.status(400).json({ message: 'NGS' });
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });
    let info = await noblox.getPlayerInfo(req.session.userid);
    let color = await db.config.findOne({ name: 'color' });
    let user = await db.user.findOne({ userid: req.session.userid });
    if (!user) {
        res.status(401).json({ message: 'Not logged in' });
        return;
    }
    if (user.role === undefined || user.role === null) {
        res.status(403).json({ message: 'Not a member' });
        return;
    };

    let role = user.role != 0 ? settings.roles.find(role => role.id === user.role).permissions : ["view_staff_activity", "admin", "manage_notices", "update_shout", 'manage_staff_activity'];
    info.perms = role;

    let pfp = await noblox.getPlayerThumbnail({ userIds: req.session.userid, cropType: "headshot" });
    res.status(200).json({
        pfp: pfp[0].imageUrl,
        info: info,
        group: {
            color: color ? color.value : 'grey lighten-2',
            noticetext: settings.noticetext,
            id: settings.group
        }
    });
});

app.post('/api/invite', async (req, res) => {
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });

    let user = await db.user.findOne({ userid: req.session.userid });
    if (user.role !== undefined && user.role !== null) return res.status(400).json({ message: 'Already a memer' });

    let invites = await db.config.findOne({ name: 'invites' });
    let invite = invites.value.find(invite => invite.code === req.body.code);
    if (!invite) return res.status(400).json({ message: 'Invalid invite code' });

    user.role = invite.role;
    await user.save();

    res.status(200).json({ message: 'Successfully joined group' });
});

app.post('/api/signup/start', async (req, res) => {
    var emojis = [
        '📋', '🎉', '🎂', '📆', '✔️', '📃', '👍', '➕', '📢'
    ];


    let verifys = `%${chooseRandom(emojis, 5).join('')}%`;
    let uid = await noblox.getIdFromUsername(req.body.username).catch(e => {
        res.status(404).json({ message: 'No such user!' });
        return;
    });
    if (!uid) return;
    req.session.verify = {
        code: verifys,
        uid: uid
    }
    res.status(200).json({
        string: verifys
    });
});

app.post('/api/signup/verify', async (req, res) => {
    if (!req.session.verify) return res.status(400).json({ message: 'No verification code!' });
    const fetchuser = await noblox.getPlayerInfo(req.session.verify.uid);

    if (!fetchuser.blurb.includes(req.session.verify.code)) {
        res.status(401).json({ message: 'Wrong code!' });
        return;
    }

    req.session.verify.success = true;
    res.status(200).json({});
});


app.post('/api/signup/finish', async (req, res) => {
    if (!req.session.verify) return res.status(400).json({ message: 'No verification code!' });
    if (!req.session.verify.success) return res.status(401).json({ message: 'Please finish first!' });

    let hash = await bcrypt.hash(req.body.password, 10);
    let invite;
    if (req.body.invite) {
        let invites = await db.config.findOne({ name: 'invites' });
        let findinvite = invites.value.find(invite => invite.code === req.body.invite);
        if (findinvite) {
            invite = findinvite.role;
        }
    }

    const finduser = await db.user.findOne({ userid: req.session.verify.uid });
    if (!finduser) {
        await db.user.create({
            userid: req.session.verify.uid,
            passwordhash: hash,
            role: invite || undefined
        });
    } else {
        finduser.passwordhash = hash;
        finduser.role = invite || undefined;
        await finduser.save()
    }

    req.session.userid = req.session.verify.uid;
    req.session.verify = undefined;

    res.status(200).json({
        uid: req.session.userid
    });

});

app.post('/api/login', async (req, res) => {
    let target = await noblox.getIdFromUsername(req.body.username).catch(err => { });
    if (!target) return res.status(400).json({ message: 'User not found' });
    let user = await db.user.findOne({ userid: target });
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.passwordhash) return res.status(401).json({ message: 'User not found' });

    if (!bcrypt.compareSync(req.body.password, user.passwordhash)) {
        res.status(401).json({ message: 'User not found' });
        return;
    };

    req.session.userid = target;
    res.status(200).json({ message: 'Successfully logged in!' });
})

async function fetchpfp(uid) {
    if (pfps.get(uid)) {
        return pfps.get(uid);
    }
    let pfp = await noblox.getPlayerThumbnail({ userIds: uid, cropType: "headshot" });
    pfps.set(parseInt(uid), pfp[0].imageUrl, 10000);

    return pfp[0].imageUrl
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


app.listen(process.env.PORT || process.env.port || 8080)