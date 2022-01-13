const mongoose = require('mongoose');

const config = new mongoose.Schema({
    name: String,
    value: mongoose.Schema.Types.Mixed
})

module.exports = mongoose.models['configs'] || mongoose.model('configs', config, 'configs');