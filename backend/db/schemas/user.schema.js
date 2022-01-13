const mongoose = require('mongoose');

const user = new mongoose.Schema({
    passwordhash: String,
    userid: Number,
    role: Number,
    verify: {
        uid: Number,
        code: String,
    }
})

module.exports = mongoose.models['users'] || mongoose.model('users', user, 'users');