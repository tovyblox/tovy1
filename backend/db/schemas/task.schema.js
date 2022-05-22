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
    completedUsers: [String],
    assignedBy: Number,
    due: Date,
    createdAt: Date,
})

module.exports = mongoose.models['tasks'] || mongoose.model('tasks', task, 'tasks');