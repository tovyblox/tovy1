const mongoose = require('mongoose');

const automation = new mongoose.Schema({
    id: Number,
    name: String,
    description: String,
    eventtype:  String,
    actions: [{
        actionType: String,
        data: mongoose.Schema.Types.Mixed
    }] 
})

module.exports = mongoose.models['automation'] || mongoose.model('automation', automation, 'automation');