const mongoose = require('mongoose');

const workspace = new mongoose.Schema({
    id: Number,
    owner: Number,
    settings: [{ name: String, value: mongoose.Schema.Types.Mixed }],
    users: [{ userid: Number, role: Number }],
})

module.exports = mongoose.models['workspace'] || mongoose.model('workspace', workspace, 'workspace');