const mongoose = require('mongoose');

const log = new mongoose.Schema({
    id: Number,
    userId: Number,
    message: String,
})

module.exports = mongoose.models['alogs'] || mongoose.model('alogs', log, 'alogs');