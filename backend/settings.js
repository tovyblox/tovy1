const db = require('./db/db');
const noblox = require('noblox.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs')
const path = require('path')
const _ = require('lodash');
const express = require('express');
let package = require('../package.json');
const fun = require('funcaptcha');
const axios = require('axios')
const cookieParser = require('set-cookie-parser');
const router = express.Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36'

const erouter = (cacheEngine, settings, permissions, logging) => {
    let perms = permissions.perms;
    let checkPerm = permissions.checkPerm

    router.post('/adduser', perms('admin'), async (req, res) => {
        if (!req.body?.username) return res.status(400).send({ success: false, message: 'No username provided' });
        if (typeof req.body.username !== 'string') return res.status(400).send({ success: false, message: 'Username must be a string' });
        const robloxusername = await noblox.getIdFromUsername(req.body.username).catch(() => {
            res.status(400).json({ message: 'No such roblox user!' });
        });
        if (!robloxusername) return;
        logging.newLog(`has added user **${req.body.username}** to this instance`, req.session.userid);
        const finduser = await db.user.findOne({ userid: parseInt(robloxusername) });
        if (finduser) {
            finduser.role = 1;
        } else {
            await db.user.create({
                userid: parseInt(robloxusername),
                role: 1
            });
        }

        res.status(200).json({ message: 'Successfully added user!', uid: robloxusername });
    });



    router.get('/users', perms('admin'), async (req, res) => {
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let users = await db.user.find({});
        let s = [];
        for (u of users) {
            let e = u.toObject();
            let username = await cacheEngine.fetchusername(u.userid);
            e.passwordhash = undefined;
            e._id = undefined;
            e.username = username;
            s.push(e)
            if (users.indexOf(u) == users.length - 1) {
                res.status(200).json({ message: 'Successfully fetched unaprooved ias!', users: s });
            }
        }
    });

    router.get('/checkupdates', perms('admin'), async (req, res) => {
        let red;
        try {
            red = await axios.get('https://bot.tovyblox.xyz/changes/latestupdate');
        } catch (e) {
            return res.status(200).json({ updates: false });
        }

        let ver = parseFloat(package.version.split('.').slice(0, 2).join('.'));
        if (ver >= red.data.version) return res.status(200).json({ updates: false });
        return res.status(200).json({ updates: true, ...red.data });
    });

    router.post('/automation/new', perms('admin'), async (req, res) => {
        let id = await db.automation.countDocuments({});
        let a = new db.automation({
            id: id + 1,
            eventtype: undefined,
            name: `Automation ${id + 1}`,
            actions: []
        });
        await a.save();
        res.status(200).json({ message: 'Successfully created new automation!', automation: a });
    });
    router.patch('/automation/:id', perms('admin'), async (req, res) => {
        let id = parseInt(req.params.id);
        let a = await db.automation.findOne({ id: id });
        if (!a) return res.status(400).json({ message: 'No automation with that id!' });
        if (req.body.name) a.name = req.body.name;
        if (req.body.eventtype) a.eventtype = req.body.eventtype;
        if (req.body.actions) a.actions = req.body.actions;
        await db.automation.findOneAndUpdate({ id: id }, a, {
            upsert: true
        });
        res.status(200).json({ message: 'Successfully updated automation!', automation: a });
    });
    router.delete('/automation/:id', perms('admin'), async (req, res) => {
        let id = parseInt(req.params.id);
        let a = await db.automation.findOne({ id: id });
        if (!a) return res.status(400).json({ message: 'No automation with that id!' });
        await db.automation.findOneAndDelete({ id: id });
        res.status(200).json({ message: 'Successfully deleted automation!' });
    });

    router.get('/automations', perms('admin'), async (req, res) => {
        let automations = await db.automation.find({});
        res.status(200).json({ message: 'Successfully fetched automations!', automations: automations });
    });

    async function getFieldData(username, password) {
        let csrf = await axios.post(`https://auth.roblox.com/v2/login`).catch(e => e.response)
        let c = csrf.headers['x-csrf-token'];
        const headers = {
            'authority': 'auth.roblox.com',
            'x-csrf-token': c,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/536.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
            'content-type': 'application/json;charset=UTF-8',
            'accept': 'application/json, text/plain, */*'
        }
        
        const data = await axios.post('https://auth.roblox.com/v2/signup', {}, {
            headers: headers,
        }).catch(e => e.response)
    
        const json = data.data;
        if (data.status === 429) {
            throw 'ratelimoted'
        
        }
        return json['failureDetails'][0]['fieldData']
    }
    
    router.post('/getcaptcha', perms('admin'), async (req, res) => {
        let { username, password } = req.body;
        let data= await getFieldData(username, password)

        let token = await fun.getToken({
            pkey: "476068BF-9607-4799-B53D-966BE98E2B81",
            surl: "https://roblox-api.arkoselabs.com",
            data: {
                blob: data.split(',')[1]
            },
            headers: {
                "User-Agent": UA
            }
        })

        let s = new fun.Session(token, { userAgent: UA });
        
        req.session.captcha = {
            username: username,
            password:   password,
            token: token,
            id: data.split(',')[0]
        }
        res.json({ url: s.getEmbedUrl() });
        
    });

 

    router.post('/login', perms('admin'), async (req, res) => {
        //if (!req.body?.cookie) return res.status(400).json({ success: false, message: 'No cookie previded' });
        //if (typeof req.body.cookie !== 'string') return res.status(400).json({ success: false, message: 'Cookie must be a string' });
        const { username, password } = req.body;
        const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36'

        let capcha = req.session.captcha;
        if (!capcha) return res.status(400).json({ success: false, message: 'No captcha provided' });
        let csrf = await axios.post(`https://auth.roblox.com/v2/login`).catch(e => e.response)
        let csfrtoken = csrf.headers['x-csrf-token'];

        let loginreq = await axios.post('https://auth.roblox.com/v2/login', { 
            ctype: "Username", 
            cvalue: capcha.username,
            password: capcha.password,
            captchaToken: capcha.token.token,
            captchaId: capcha.id,
            captchaProvider: "PROVIDER_AKOSE_LABS",
        }, {
            headers: {
                'x-csrf-token': csfrtoken,
            }
        }).catch(e => {
            res.status(400).json({ success: false, message: 'Failed to login' });
            return
        })
        if (!loginreq) return;
        let cookie = cookieParser.parse(loginreq.headers[`set-cookie`], {
            map: true
        })['.ROBLOSECURITY'].value;
        
        
        let user;
        try {
            user = await noblox.setCookie(cookie);
        } catch (e) {
            res.status(400).json({ message: 'Invalid cookie!' });
            return;
        };

        let pfp = await cacheEngine.fetchpfp(user.UserID)
        // generate random hex with crypto
        let config = settings.get('ranking');
        let hash = config?.hash || crypto.randomBytes(20).toString('hex');
        settings.set('ranking', {
            cookie: cookie,
            hash
        });

        logging.newLog(`has updated the ranking account to **${user.UserName}**`, req.session.userid);


        settings.settings.ranking = {
            username: user.UserName,
            uid: user.UserID,
            pfp,
            apikey: hash
        };


        res.status(200).json({ message: 'Successfully set cookie!', info: settings.get('ranking') });
    });


    router.post('/updateuserroles', perms('admin'), async (req, res) => {
        if (!req.body?.userid) return res.status(400).json({ success: false, message: 'No user previded' });
        if (typeof req.body.userid !== 'number') return res.status(400).json({ success: false, message: 'User must be a string' });
        let user = await db.user.findOne({ userid: parseInt(req.body.userid) });
        if (!user) return res.status(400).json({ message: 'No such user!' });
        if (user.role == 0) return res.status(400).json({ message: 'No such user!' });
        let username = await cacheEngine.fetchusername(user.userid);
        if (req.body.role == 'delete') {
            user.role = undefined;
            await user.save();
            res.status(200).json({ message: 'Successfully updated user!' });
            logging.newLog(`has removed user **${username}** from this instance`, req.session.userid);
            return;
        }
        let s = settings.get('roles').find(r => r.id == req.body.role)
        if (!s) return res.status(400).json({ message: 'No such role!' });
        logging.newLog(`has updated the role of user **${username}** to **${s.name}**`, req.session.userid);


        user.role = parseInt(req.body.role);
        await user.save();

        res.status(200).json({ message: 'Successfully updated user!' });
    });

    router.post('/setpolicy', perms('admin'), async (req, res) => {
        if (!req.body?.text) return res.status(400).json({ success: false, message: 'No policy previded' });
        if (typeof req.body.text !== 'string') return res.status(400).json({ success: false, message: 'Policy must be a string' });
        settings.set('noticetext', req.body.text)
        logging.newLog(`has updated the inactive notice policy to **${req.body.text}**`, req.session.userid);

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/setwall', perms('admin'), async (req, res) => {
        settings.set('wall', req.body.settings);
        logging.newLog(`has updated the wall`, req.session.userid);
        const body = req.body;

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/setsessions', perms('admin'), async (req, res) => {
        const body = req.body;
        settings.set('sessions', body.settings)
        logging.newLog(`has updated session settings`, req.session.userid);


        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/setproxy', perms('admin'), async (req, res) => {
        if (req.body?.enabled == null) return res.status(400).json({ success: false, message: 'No enabled previded' });
        if (typeof req.body.enabled !== 'boolean') return res.status(400).json({ success: false, message: 'Enabled must be a string' });
        settings.set('wproxy', req.body.enabled);
        logging.newLog(`has **${req.body.enabled ? 'enabled' : 'disabled'}** the wall`, req.session.userid);

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/settr', perms('admin'), async (req, res) => {
        if (req.body?.enabled == null) return res.status(400).json({ success: false, message: 'No enabled previded' });
        if (typeof req.body.enabled !== 'boolean') return res.status(400).json({ success: false, message: 'Enabled must be a string' });
        try {
            req.body.enabled ? await settings.regester(req.get('origin')) : await settings.deregester();
        } catch (e) {
            console.log(e)
            return res.status(500).json({ success: false, message: 'Failed to register!' });
        }
        logging.newLog(`has **${req.body.enabled ? 'enabled' : 'disabled'}** the Tovy registry`, req.session.userid);

        res.status(200).json({ message: 'Updated!' });
    });

    router.post('/resetactivity', perms('admin'), async (req, res) => {
        await db.session.deleteMany({ active: false });
        logging.newLog(`has reset activity`, req.session.userid);
        res.status(200).json({ message: 'Updated!' });
    });

    router.get('/other', perms('admin'), async (req, res) => {
        const config = await db.config.find({});
        if (!config) return res.status(400).json({ message: 'No config!' });
        let c = {
            noticetext: settings.get('noticetext'),
            role: settings.get('activity')?.role,
            tovyr: settings.get('tovyr')?.enabled,
            proxy: settings.get('wproxy'),
            ranking: settings.get('ranking'),
            wall: settings.get('wall'),
            sessions: settings.get('sessions'),
            groupgames: await noblox.getGroupGames(settings.get('group'), "Public")
        }
        res.status(200).json({ message: 'Successfully fetched config!', config: c });
    })

    router.get('/roles', perms('admin'), async (req, res) => {
        const config = await settings.get('roles');

        if (!config) return res.status(400).json({ message: 'No roles found!' });
        res.status(200).json({ message: 'Successfully fetched roles!', roles: config });
    })

    router.get('/invites', perms('admin'), async (req, res) => {
        const config = await settings.get('invites');

        if (!config) return res.status(400).json({ message: 'No invites found!' });
        res.status(200).json({ message: 'Successfully fetched invites!', invites: config });
    })

    router.post('/updateroles', perms('admin'), async (req, res) => {
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let config = await db.config.findOne({ name: 'roles' });
        settings.set('roles', req.body.roles);

        res.status(200).json({ message: 'Successfully updated roles!' });
    });

    router.post('/updateinvites', perms('admin'), async (req, res) => {
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let cf = await db.config.findOne({ name: 'invites' });
        let invites = req.body.invites;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
        for (invite of invites) {
            if (invite.code) continue;
            invite.code = chooseRandom(letters, 12).join('')
        };
        logging.newLog(`has updated roles`, req.session.userid);
        settings.set('invites', invites);

        res.status(200).json({ message: 'Successfully updated invites!', invites: invites });
    });

    router.post('/newinvite', perms('admin'), async (req, res) => {
        let uid = req.session.userid;

        if (!uid) return res.status(401).json({ message: 'go away!' });

        let cd = settings.get('invites')
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

        let zz = {
            role: 1,
            code: chooseRandom(letters, 12).join('')
        }

        if (cd) {
            let e = cd;
            settings.set('invites', [...e, zz]);
        } else {
            let invites = [zz];
            settings.set('invites', invites);

        };
        logging.newLog(`has created a new role`, req.session.userid);

        res.status(200).json({ message: 'Successfully updated invites!', invite: zz });
    });

    router.get('/groles', async (req, res) => {
        let cp = await checkPerm(req.session.userid, 'manage_staff_activity');
        let othercp = await checkPerm(req.session.userid, 'admin');

        if (!othercp && !cp) return res.status(401).json({ message: 'go away!' });

        let group = settings.get('group');

        let roles = await noblox.getRoles(group)
        res.status(200).json({ message: 'Successfully fetched roles!', roles: roles, currole: settings.get('activity').role });
    });

    router.post('/setgrouprole', perms('admin'), async (req, res) => {
        let curconfig = settings.get('activity');
        settings.set('activity', {
            key: curconfig.key,
            role: req.body.role
        })
        logging.newLog(`has updated acitvity settings`, req.session.userid);

        res.status(200).json({
            message: 'ok'
        })
    })



    router.post('/setcolor', perms('admin'), async (req, res) => {
        if (!req.body?.color) return res.status(400).json({ success: false, message: 'No color previded' });
        if (typeof req.body.color !== 'string') return res.status(400).json({ success: false, message: 'Colored must be a string' });
        settings.set('color', req.body.color);
        logging.newLog(`has updated the color to **${req.body.color}**`, req.session.userid);

        res.status(200).json({
            message: 'ok'
        })
    });

    router.get('/loader', perms('admin'), async (req, res) => {

        let xml_string = fs.readFileSync(path.join(__dirname, 'Script.rbxmx'), "utf8");
        res.setHeader('Content-Disposition', 'attachment; filename=tovy_activity.rbxmx');
        let xx = xml_string.replace('<api>', settings.get('activity').key).replace('<ip>', `http://${req.headers.host}/api`);

        res.type('rbxmx')
        res.send(xx);
    })

    router.get('/bloader', perms('admin'), async (req, res) => {
        let xml_string = fs.readFileSync(path.join(__dirname, 'TovyBans.rbxmx'), "utf8");
        res.setHeader('Content-Disposition', 'attachment; filename=TovyBans.rbxmx');
        let xx = xml_string.replace('<url>', `http://${req.headers.host}`);
        res.type('rbxmx')
        res.send(xx);
    })

    router.get('/rloader', perms('admin'), async (req, res) => {
        let xml_string = fs.readFileSync(path.join(__dirname, 'Tovy_RankingLoader.rbxmx'), "utf8");
        res.setHeader('Content-Disposition', 'attachment; filename=Tovy_RankingLoader.rbxmx');
        let xx = xml_string.replace('<key>', settings.get('ranking').apikey).replace('<url>', `http://${req.headers.host}/api/ranking`);

        res.type('rbxmx')
        res.send(xx);
    })

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

    return router;
};

module.exports = erouter;

