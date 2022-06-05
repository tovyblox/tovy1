const mongoose = require('mongoose');

const taskUser = new mongoose.Schema({
    id: Number,
    username: String,
    completed: Boolean,
    completedAt: Date,  
})

const task = new mongoose.Schema({
    id: Number,
    name: String,
    description: String,
    assignedRoles: [String],
    creatorAvatar: String,
    assignedUsers: [String],
    completed: Boolean,
    author: Number,
    due: Date,
    createdAt: Date,
    priority: Number,
    id: String,
})

module.exports = mongoose.models['tasks'] || mongoose.model('tasks', task, 'tasks');