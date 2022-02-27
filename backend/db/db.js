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
    ia: require('./schemas/ia.schema'),
    message: require('./schemas/message.schema'),
    ranklog: require('./schemas/ranklog.schema'),
    gsession: require('./schemas/gsession.schema'),
}