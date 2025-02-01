const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  lastContact: {
    type: Date
  },
  followUpDate: {
    type: Date
  },
  alerts: [{
    type: {
      type: String,
      enum: ['reminder', 'followUp', 'dealUpdate', 'custom'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  deals: [{
    title: String,
    value: Number,
    status: {
      type: String,
      enum: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
      default: 'prospecting'
    },
    expectedCloseDate: Date
  }],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  // Add indexes for Cosmos DB
  indexes: [
    [{ updatedAt: -1 }],
    [{ isBookmarked: 1, updatedAt: -1 }],
    [{ isActive: 1 }]
  ]
});

// Update the updatedAt timestamp before saving
clientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;