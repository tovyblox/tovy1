const mongoose = require('mongoose');

const session = new mongoose.Schema({
    active: Boolean,
    start: Date,
    end: Date,
    uid: Number,
    mins: Number,
    type: String
})

module.exports = mongoose.models['sessions'] || mongoose.model('sessions', session, 'sessions');