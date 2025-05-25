const mongoose = require('mongoose');

const researchSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  company: String,
  companyName: String,
  data: {
    google: [mongoose.Schema.Types.Mixed],
    reddit: [mongoose.Schema.Types.Mixed],
    apollo: mongoose.Schema.Types.Mixed,
    pdl: mongoose.Schema.Types.Mixed
  },
  dealIntelligence: mongoose.Schema.Types.Mixed,
  summary: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastUpdatedGoogle: Date,
  lastUpdatedReddit: Date,
  lastDealAnalysis: Date
}, {
  minimize: false,
  autoIndex: false
});

// Update timestamps
researchSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Optimized indexes for Cosmos DB
researchSchema.index({ clientId: 1, userId: 1 });
researchSchema.index({ userId: 1, lastDealAnalysis: -1 });

const Research = mongoose.model('Research', researchSchema);

module.exports = Research;