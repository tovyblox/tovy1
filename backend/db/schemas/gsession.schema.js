const mongoose = require('mongoose');

const session = new mongoose.Schema({
    start: Date,
    end: Date,
    uid: Number,
    started: Boolean,
    type: Object,
    thumbnail: String,
    id: Number,
    did: String
})

module.exports = mongoose.models['gsessions'] || mongoose.model('gsessions', session, 'gsessions');