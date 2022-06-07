const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err => {
    if (err) {
        console.error(err)
    }
}));



module.exports = {
    user: require('./schemas/user.schema'),
    session: require('./schemas/session.schema'),
    config: require('./schemas/config.schema'),
    automation: require('./schemas/automation.schema'),
    book: require('./schemas/book.schema'),
    ia: require('./schemas/ia.schema'),
    log: require('./schemas/log.schema'),
    message: require('./schemas/message.schema'),
    ranklog: require('./schemas/ranklog.schema'),
    gsession: require('./schemas/gsession.schema'),
    ban: require('./schemas/ban.schema'),
    task: require('./schemas/task.schema'),
}