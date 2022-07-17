const argv = require('minimist')(process.argv.slice(2));
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express');
const app = express();
const db = require('./db/db');
const noblox = require('noblox.js');
const history = require('connect-history-api-fallback');
const ora = require('ora');
const CacheEngineLoader = require('./util/cacheEngine');
const cacheEngine = new CacheEngineLoader();
let package = require('../package.json');
const fs = require('fs');
const twofactor = require('node-2fa');
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
let backendonly = false;

if (argv['backend-only'] || argv.b) backendonly = true;
if (backendonly) {
    console.log('Running tovy on the backend')
}

const _ = require('lodash');
const LoggingEngine = require('./util/loggingEngine');
const automationEngine = require('./util/automationEngine');
const logging = new LoggingEngine();

const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const permissionsManager = require('./util/permissionsManager');
const settingsManager = require('./util/settingsManager');
const settings = new settingsManager();
const automation = new automationEngine(logging, settings, noblox);
const permissions = new permissionsManager(settings);
const ews = require('express-ws')(app);
let activews = [];



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
    await settings.load();
    let configforranking = settings.get('ranking');
    if (configforranking) {
        let u;
        try {
            u = await noblox.setCookie(configforranking.cookie);
        } catch (e) {
            settings.settings.ranking = {
                apikey: configforranking.hash,
            };
        }

        if (u) {
            settings.settings.ranking = {
                username: u.UserName,
                uid: u.UserID,
                pfp: await cacheEngine.fetchpfp(u.UserID),
                apikey: configforranking.hash,
            };
        }

    }

    runload()
})();

async function runload() {
    console.log('Running tovy!')
    app.use('/api/activity/', require('./activity')(cacheEngine, settings, permissions, automation));
    app.use('/api/tasks/', require('./tasks')(cacheEngine, settings, permissions, logging, automation));
    app.use('/api/wall/', require('./wall')(cacheEngine, settings, permissions, automation));
    app.use('/api/staff', require('./staff')(cacheEngine, settings, permissions, automation));
    app.use('/api/settings/', require('./settings')(cacheEngine, settings, permissions, logging));
    app.use('/api/sessions/', require('./session')(cacheEngine, settings, permissions, automation));
    app.use('/api/bans/', require('./bans')(cacheEngine, settings, permissions, logging, automation));
    app.use('/api/ranking/', require('./ranking')(cacheEngine, settings, permissions, automation));
}



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


app.post('/api/webhooks/:id/:secret', async (req, res) => {
    if (!settings.get('wproxy')) return res.status(500).send({ success: false, message: 'proxy not set' });
    await axios.post('https://discord.com/api/webhooks/' + req.params.id + '/' + req.params.secret, req.body).then(r => {
        res.send({
            success: true
        })
    }).catch(e => {
        res.status(e.response.status).send(e.response.data)
    })
})

app.get('/info', (req, res) => {
    let tovyr = settings.get('tovyr');
    if (!tovyr?.enabled) return res.status(500).send({ success: false, message: 'tovyr not enabled' });
    if (req.headers['api-key'] !== tovyr.key) return res.status(500).send({ success: false, message: 'invalid api key' });
    res.send({
        success: true,
        version: package.version,
    })

});

app.patch('/api/webhooks/:id/:secret/messages/:msg', async (req, res) => {
    if (!settings.get('wproxy')) return res.status(500).send({ success: false, message: 'proxy not set' });
    await axios.patch(`https://discord.com/api/webhooks/${req.params.id}/${req.params.secret}/messages/${req.params.msg}`, req.body).then(r => {
        res.send(r.data)
    }).catch(e => {
        res.status(e.response.status).send(e.response.data)
    })
})

app.delete('/api/webhooks/:id/:secret/messages/:msg', async (req, res) => {
    if (!settings.get('wproxy')) return res.status(500).send({ success: false, message: 'proxy not set' });

    await axios.delete(`https://discord.com/api/webhooks/${req.params.id}/${req.params.secret}/messages/${req.params.msg}`, req.body).then(r => {
        res.send({
            success: true
        })
    }).catch(e => {
        res.status(e.response.status).send(e.response.data)
    })
})

app.post('/api/finishSignup', async (req, res) => {
    if (settings.get('group')) return res.status(500).send({ success: false, message: 'group signups are disabled' });
    if (!req.body.password) return res.status(500).send({ success: false, message: 'password not set' });
    const hash = bcrypt.hashSync(req.body.password, 10);
    let uid = await noblox.getIdFromUsername(req.body.username)

    await db.user.create({
        userid: uid,
        passwordhash: hash,
        role: 0
    });

    req.session.userid = uid;

    settings.set('group', req.body.group)

    let a = {
        key: chooseRandom(letters, 18).join(''),
        role: null
    }

    settings.set('activity', a);
    res.status(200).json({ message: 'Successfully created user!' });
    await settings.set('roles', [
        {
            "name": "Member",
            "permissions": [
                "view_staff_activity"
            ],
            "id": 1
        },
        {
            "name": "HR",
            "permissions": [
                "view_staff_activity",
                "host_sessions",
                "post_on_wall"
            ],
            "id": 2
        },
        {
            "name": "Manager",
            "permissions": [
                "view_staff_activity",
                "manage_notices",
                "manage_bans",
                "update_shout",
                "post_on_wall",
                "host_sessions"
            ],
            "id": 3
        },
        {
            "name": "Admin",
            "permissions": [
                "view_staff_activity",
                "admin",
                "manage_bans",
                "manage_notices",
                "manage_staff_activity",
                "update_shout",
                "post_on_wall",
                "host_sessions",
                "manage_tasks",
            ],
            "id": 4
        }
    ])
    await db.message.create({
        id: 1,
        author: 469981094,
        message: `## Welcome to Tovy!
Here are a few things that will help you get started
- You can customize your Tovy instance in the settings 
- Download the loader and start tracking activity on the settings page
- Manage your groups staff on the staff page

**Links**
Here are some links that may help you in the future
- [View some features on our website](https://tovyblox.xyz/)
- [Report feedback or bugs](https://feedback.tovyblox.xyz/)
- [Get help and chat in our discord](https://discord.gg/nsTHUewP3u)
- [Contribute to our src code](https://github.com/tovyblox/tovy)`,
        date: Date.now(),
        deleted: false
    })
    if (req.body.regester) setTimeout(() => settings.regester(req.get('origin')), 2000);
});

/**
 * @param {wss} ws
 
 */

app.get('/api/getuser/:name', async (req, res) => {
    if (!req.params.name) return res.status(500).send({ success: false, message: 'no name' });
    let uid = await noblox.getIdFromUsername(req.params.name);
    if (!uid) return res.status(500).send({ success: false, message: 'user not found' });
    let user = await db.user.findOne({
        where: {
            userid: uid
        }
    });
    if (!user) return res.status(500).send({ success: false, message: 'user not found' });
    res.send({
        success: true,
        user: user
    })
})

app.get('/api/profile', async (req, res) => {
    if (!await db.config.findOne({ name: 'group' })) return res.status(400).json({ message: 'NGS' });
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });
    let info = await noblox.getPlayerInfo(req.session.userid).catch(err => {
        return res.status(401).json({ message: 'Not logged in' });
    });
    if (!info) return;
    let color = await settings.get('color');
    let user = await db.user.findOne({ userid: req.session.userid });
    if (!user) {
        res.status(401).json({ message: 'Not logged in' });
        return;
    }
    if (user.role === undefined || user.role === null) {
        res.status(403).json({ message: 'Not a member' });
        return;
    };
 
    if (!settings.get('roles').find(role => role.id === user.role)) {
        res.status(403).json({ message: 'Not a member' });
        return
    }

    let role = user.role != 0 ? settings.get('roles').find(role => role.id === user.role).permissions : ["view_staff_activity", "admin", "manage_notices", "update_shout", 'manage_staff_activity', 'host_sessions', 'post_on_wall', 'manage_bans', 'manage_tasks'];
    info.perms = role;
    info.id = req.session.userid;

    let pfp = await noblox.getPlayerThumbnail({ userIds: req.session.userid, cropType: "headshot" });
    res.status(200).json({
        pfp: pfp[0].imageUrl,
        '2fa': !!user['2fa'],
        info: info,
        group: {
            color: color || 'grey lighten-2',
            noticetext: settings.get('noticetext'),
            id: settings.get('group')
        }
    });
});

app.post('/api/invite', async (req, res) => {
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });

    let user = await db.user.findOne({ userid: req.session.userid });
    if (user.role === 0) return res.status(200).json({ message: 'Successfully joined group' });

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
        finduser.role = invite || finduser.role || undefined;
        await finduser.save()
    }

    req.session.userid = req.session.verify.uid;
    req.session.verify = undefined;

    res.status(200).json({
        uid: req.session.userid
    });

});

app.get('/api/pfp/name/:name', async (req, res) => {
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });
    if (!req.params.name) return res.status(400).json({ message: 'No name specified' });
    let uid = await noblox.getIdFromUsername(req.params.name).catch(e => {
        if (!uid) return res.status(404).json({ message: 'No such user!' });
        res.status(404).json({ message: 'No such user!' });
        return;
    });
    const pfp = await cacheEngine.fetchpfp(uid);
    res.status(200).json({
        pfp: pfp
    });
});

app.get('/api/pfp/id/:id', async (req, res) => {
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });
    if (!req.params.id) return res.status(400).json({ message: 'No id specified' });
    const pfp = await cacheEngine.fetchpfp(Number(req.params.id));
    res.status(200).json({
        pfp: pfp
    });
});

app.post('/api/login', async (req, res) => {
    if (!req.body.username || !req.body.password) return res.status(400).json({ message: 'No username or password!' });
    if (typeof req.body.username !== 'string' || typeof req.body.password !== 'string') return res.status(400).json({ message: 'Invalid username or password!' });
    let target = await noblox.getIdFromUsername(req.body.username).catch(err => { });
    if (!target) return res.status(400).json({ message: 'User not found' });
    let user = await db.user.findOne({ userid: target });
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.passwordhash) return res.status(401).json({ message: 'User not found' });

    if (!bcrypt.compareSync(req.body.password, user.passwordhash)) {
        res.status(401).json({ message: 'User not found' });
        return;
    };
    if (user['2fa']) {
        const newToken = twofactor.generateToken(user['2fa']);

        req.session['2fa'] = {
            userid: user.userid,
            code: newToken,
            awaiting: true,
        }
        res.status(401).json({ message: '2fa required' });
        return;
    }
    req.session.userid = target;
    res.status(200).json({ message: 'Successfully logged in!' });
});

app.post('/api/finish2fa', async (req, res) => {
    if (!req.session['2fa']) return res.status(400).json({ message: 'No 2fa code!' });
    let user = await db.user.findOne({ userid: req.session['2fa'].userid });
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!req.body.code) return res.status(400).json({ message: 'No code!' });
    if (typeof req.body.code !== 'string') return res.status(400).json({ message: 'Invalid code!' });
    

    let delta = twofactor.verifyToken(user['2fa'], req.body.code);
    if (delta?.delta !== 0) return res.status(401).json({ message: 'Invalid code!' });
    req.session.userid = req.session['2fa'].userid;
    res.status(200).json({ message: 'Successfully logged in!' });
});

app.post('/api/setup2fa', async (req, res) => {
    if (!req.session.userid) return res.status(401).json({ message: 'Not logged in' });
    let user = await db.user.findOne({ userid: req.session.userid });
    if (user['2fa'] ) {
        return res.status(400).json({ message: '2fa already setup!' });
    }
    
    let new2fa = twofactor.generateSecret({ name: "Tovy", account: await noblox.getUsernameFromId(req.session.userid) });
    let code = twofactor.generateToken(new2fa);
    //user['2fa'] = new2fa;
    //await user.save();
    req.session['2fasetup'] = {
        secret: new2fa,
        code: code,
    }
    res.status(200).json({ qr: new2fa.qr, secret: new2fa.secret });
})

app.post('/api/confirm2fa', async (req, res) => {
    if (!req.session['2fasetup']) return res.status(400).json({ message: 'No 2fa code!' });
    if (!req.body.code) return res.status(400).json({ message: 'No code!' });
    if (typeof req.body.code !== 'string') return res.status(400).json({ message: 'Invalid code!' });
    let user = await db.user.findOne({ userid: req.session.userid });   
    if (!user) return res.status(401).json({ message: 'User not found' });
    let session = req.session['2fasetup']

    let delta = twofactor.verifyToken(session.secret.secret, `${req.body.code}`);
    if (!delta || delta.delta !== 0) return res.status(401).json({ message: 'Invalid code!' });

    user['2fa'] = session.secret.secret;
    await user.save();
    req.session['2fasetup'] = undefined;
    res.status(200).json({ message: 'Set up 2fa!' });
})

app.post('/api/turnoff2fa', async (req, res) => {
    if (!req.body.code) return res.status(400).json({ message: 'No code!' });
    if (typeof req.body.code !== 'string') return res.status(400).json({ message: 'Invalid code!' });
    let user = await db.user.findOne({ userid: req.session.userid });   
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user['2fa']) return res.status(400).json({ message: 'No 2fa code!' });


    let delta = twofactor.verifyToken(user['2fa'], `${req.body.code}`);
    if (!delta || delta.delta !== 0) return res.status(401).json({ message: 'Invalid code!' });

    user['2fa'] = undefined;
    await user.save();
    res.status(200).json({ message: 'Disabled 2fa!' });
})








module.exports = { cacheEngine };


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

console.log('running on http://localhost:' + process.env.PORT || process.env.port || 8080);
app.listen(process.env.PORT || process.env.port || 8080)