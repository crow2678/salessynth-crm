const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true // Important for Cosmos DB partitioning
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
    default: true,
    index: true
  },
  isBookmarked: {
    type: Boolean,
    default: false,
    index: true
  },
  isRecent: {
    type: Boolean,
    default: true,
    index: true
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
    default: Date.now,
    index: true // For recent sorting
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  minimize: true,
  autoIndex: false,
  strict: true,
  timestamps: true
});

// Update timestamps, deal lastUpdated, and isRecent flag
clientSchema.pre('save', function(next) {
  const now = new Date();
  this.updatedAt = now;
  
  // Update isRecent flag (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  this.isRecent = this.createdAt > thirtyDaysAgo;
  
  // Update deals if modified
  if (this.isModified('deals')) {
    this.deals.forEach(deal => {
      deal.lastUpdated = now;
    });
  }
  next();
});

// Background task to update isRecent flag periodically
clientSchema.statics.updateRecentFlags = async function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await this.updateMany(
    { 
      isRecent: true,
      createdAt: { $lt: thirtyDaysAgo }
    },
    { 
      $set: { isRecent: false }
    }
  );
};

// Compound indexes optimized for Cosmos DB
clientSchema.index({ userId: 1, createdAt: -1 }); // For recent clients
clientSchema.index({ userId: 1, isRecent: 1 }); // For filtering recent
clientSchema.index({ userId: 1, isBookmarked: 1 }); // For bookmarked clients
clientSchema.index({ userId: 1, isActive: 1 }); // For active clients
clientSchema.index({ userId: 1, 'deals.status': 1 }); // For deal status queries

// Method to get recent clients
clientSchema.statics.getRecentClients = function(userId, limit = 5) {
  return this.find({ 
    userId,
    isRecent: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
};

// Method to get paginated clients
clientSchema.statics.getPaginatedClients = function(userId, page = 1, limit = 10, filters = {}) {
  const query = { 
    userId,
    isRecent: false,
    ...filters
  };
  
  return Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);
};

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;