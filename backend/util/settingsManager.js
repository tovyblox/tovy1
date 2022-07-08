const db = require('../db/db');
const crypto = require('crypto');
const axios = require('axios');
module.exports = class SettingsManager {
    settings = {}

    async load() {
        let settings = await db.config.find({});
        for (let i = 0; i < settings.length; i++) {
            this.settings[settings[i].name] = settings[i].value;
        }
        console.log('[-] Settings module loaded settings')
    }

    get(name) {
        return this.settings[name];
    }

    async set(name, value) {
        this.settings[name] = value;
        let obj = await db.config.findOne({ name: name });
        if (obj) {
            obj.value = value;
            await obj.save();
        } else {
            await db.config.create({ name: name, value: value });
        }
    }

    async regester(url) {
        let isRegestered = this.get('tovyr');
        console.log(isRegestered)
        if (isRegestered?.enabled) return;
        let owner = await db.user.findOne({ role: 0 })
        let req;

        try {
           req = await axios.post('https://bot.tovyblox.xyz/registerinstance', {
                owner: owner.userid,
                key: isRegestered?.key || undefined,
                groupId: this.get('group'),
                url: url || undefined
            });
        } catch(e) {
            console.log(e.response.data)
            throw new Error('Failed to regester instance');
        }
        console.log(req.data)

        this.set('tovyr', {
            enabled: true,
            key: req.data.key,
        });
    };

    async deregester() {
        let isRegestered = this.get('tovyr');
        if (!isRegestered?.enabled) return;

        try {
            await axios.post('https://bot.tovyblox.xyz/deregisterinstance', {
                key: isRegestered.key
            });
        } catch(e) {
            console.log(e.response.data)
            throw new Error('Failed to deregester instance');
        }
        isRegestered.enabled = false;

        this.set('tovyr', isRegestered);
    }

}
