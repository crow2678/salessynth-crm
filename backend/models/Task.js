const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Add user reference
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  },
  // Add completedAt date for better tracking
  completedAt: {
    type: Date
  },
  // Optional client reference
  clientId: {
    type: String,
    ref: 'Client'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Optimize for Cosmos DB
  minimize: true,
  autoIndex: false
});

// Update timestamps and set completedAt
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set completedAt when task is completed
  if (this.isModified('completed') && this.completed) {
    this.completedAt = new Date();
  }
  next();
});

// Optimized indexes for Cosmos DB queries
taskSchema.index({ userId: 1, completed: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, clientId: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;