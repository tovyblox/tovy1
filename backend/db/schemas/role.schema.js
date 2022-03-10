const mongoose = require('mongoose');

const role = new mongoose.Schema({
    permissions: [String],
    id: Number,
    ws: Number,
    name: String,
})

module.exports = mongoose.models['roles'] || mongoose.model('roles', role, 'roles');