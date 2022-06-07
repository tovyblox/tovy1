const mongoose = require('mongoose');

const book = new mongoose.Schema({
    userid: Number,
    type: String,
    created: Date,
    notes: String,
    id: Number, 
    deleted: Boolean
})


module.exports = mongoose.models['book'] || mongoose.model('book', book, 'book');