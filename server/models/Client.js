const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
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
    expectedCloseDate: Date,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
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
  minimize: true,
  autoIndex: false
});

// Update timestamps and deal lastUpdated
clientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (this.isModified('deals')) {
    this.deals.forEach(deal => {
      deal.lastUpdated = new Date();
    });
  }
  next();
});

// Optimized indexes for Cosmos DB
clientSchema.index({ userId: 1, email: 1 });
clientSchema.index({ userId: 1, isBookmarked: 1 });
clientSchema.index({ userId: 1, isActive: 1 });
clientSchema.index({ userId: 1, 'deals.status': 1 });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;