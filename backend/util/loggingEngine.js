const db = require('../db/db');
module.exports = class LoggingEngine {
    constructor() {

    }

    async newLog(message, userid) {
        let count = await db.log.countDocuments({});
        const logdata = {
            id: count + 1,
            userId: userid,
            message: message
        }
        db.log.create(logdata);
        return logdata;
    }
}