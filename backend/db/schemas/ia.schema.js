const mongoose = require('mongoose');

const ia = new mongoose.Schema({
    start: Date,
    end: Date,
    status: String,
    uid: Number,
    id: Number,
    reason: String
})

module.exports = mongoose.models['ias'] || mongoose.model('ias', ia, 'ias');