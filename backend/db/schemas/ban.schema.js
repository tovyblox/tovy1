const mongoose = require('mongoose');

const ban = new mongoose.Schema({
    userid: Number,
    reason: String,
    until: Date,
    banned: Boolean,
    bannedby: Number,
    permanent: Boolean,
})

module.exports = mongoose.models['bans'] || mongoose.model('bans', ban, 'bans');