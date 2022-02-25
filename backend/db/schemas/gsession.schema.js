const mongoose = require('mongoose');

const session = new mongoose.Schema({
    start: Date,
    end: Date,
    uid: Number,
    started: Boolean,
    type: Number,
    id: Number,
})

module.exports = mongoose.models['gsessions'] || mongoose.model('gsessions', session, 'gsessions');