const db = require('../db/db');
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
    
}
