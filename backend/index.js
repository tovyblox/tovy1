const argv = require('minimist')(process.argv.slice(2));
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express');
const { perms } = require('./permissions')
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
    let c = await db.config.findOne({ name: 'group' });
    console.log('new group', c.value)
    if (!c) return;
    let ct = await db.workspace.findOne({ id: c.value });
    if (ct) return;

    console.log('Creating workspace');
    console.log(await db.user.findOne({ role: 0 }).then(u => u._doc.userid));

    db.workspace.create({
        id: c.value,
        owner: await db.user.findOne({ role: 0 }).then(u => u._doc.userid),
        settings: await db.config.find({}),
        users: await db.user.find({})
    })
})();

const meow = (req, res, next) => {
    console.log(next);
    next()
}

async function checkmiddleware (req, res, next, c)  {
    console.log(next)

}


console.log('Running tovy!')

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

app.get('/api/groups/@me', async (req, res) => {

})

app.get('/api/profile', async (req, res) => {
    console.log('thing')
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });
    let info = await noblox.getPlayerInfo(req.session.userid).catch(err => {
        return res.status(401).json({ message: 'Not logged in' });
    });
    if (!info) return;
    let workspace = await db.workspace.findOne({ id: req.headers['id'] });

    let pfp = await noblox.getPlayerThumbnail({ userIds: req.session.userid, cropType: "headshot" });
    res.status(200).json({
        pfp: pfp[0].imageUrl,
        info: info,
    });
});

app.get('/api/gprofile', perms(''), async (req, res, next) => {
    await checkmiddleware(req, res, next, '');
    if (!await db.workspace.findOne({ })) return res.status(400).json({ message: 'NGS' });
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });
    let info = await noblox.getPlayerInfo(req.session.userid).catch(err => {
        return res.status(401).json({ message: 'Not logged in' });
    });
    if (!info) return;

    let workspace = await db.workspace.findOne({ id: req.headers['id'] });
    console.log(workspace.settings)
    let color = workspace.settings.find(s => s.name == 'color');
    let user = await workspace.users.find(u => u.userid == req.session.userid);

    let role = user.role != 0 ? settings.roles.find(role => role.id === user.role).permissions : ["view_staff_activity", "admin", "manage_notices", "update_shout", 'manage_staff_activity', 'host_sessions', 'post_on_wall'];
    info.perms = role;
    info.id = req.session.userid;

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
        '📋', '🎉', '🎂', '📆', '✔️', '📃', '👍', '➕', '📢', '🐒', '🐴', '🐑', '🐘', '🐼', '🐧', '🐦', '🐤', '🐥', '🐣', '🐔', '🐍', '🐢', '🐛', '🐝', '🐜', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '📚', '📖', '🔖', '🎯', '🏈', '🏀', '⚽', '⚾', '🎾', '🎱', '🏉', '🎳', '⛳', '🚵', '🚴', '🏁', '🏇'
    ];


    let verifys = `🤖${chooseRandom(emojis, 11).join('')}`;
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

app.use('/api/', require('./activity')(usernames, pfps));
app.use('/api/', require('./wall')(usernames, pfps));
app.use('/api/', require('./staff')(usernames, pfps));
app.use('/api/', require('./session')(usernames, pfps));
app.use('/api/ranking/', require('./ranking')(usernames, pfps));

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