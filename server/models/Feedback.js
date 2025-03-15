const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  dealId: {
    type: String,
    ref: 'Deal'
  },
  clientId: {
    type: String,
    ref: 'Client'
  },
  predictionId: {
    type: String
  },
  rating: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    required: true
  },
  feedbackType: {
    type: String,
    enum: ['accuracy', 'relevance', 'factors', 'timeline', 'actionability', 'completeness', 'usefulness', 'visual', 'general', 'feature', 'bug'],
    default: 'general'
  },
  comments: {
    type: String,
    trim: true
  },
  itemType: {
    type: String,
    enum: ['prediction', 'insight', 'report', 'feature'],
    default: 'prediction'
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: String,
    ref: 'User'
  },
  resolution: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
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
  minimize: true,
  autoIndex: false
});

// Update timestamps middleware
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index optimization for Cosmos DB
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ dealId: 1, userId: 1 });
feedbackSchema.index({ clientId: 1, userId: 1 });
feedbackSchema.index({ rating: 1, feedbackType: 1 });
feedbackSchema.index({ itemType: 1, resolved: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;