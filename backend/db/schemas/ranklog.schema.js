const mongoose = require('mongoose');

const log = new mongoose.Schema({
    moderator: Number,
    type: String,
    data: Object,
    errored: Boolean,
})

module.exports = mongoose.models['logs'] || mongoose.model('logs', log, 'logs');