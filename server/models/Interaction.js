const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  clientId: {
    type: String,
    ref: 'Client',
    required: true
  },
  dealId: {
    type: String,
    ref: 'Deal'
  },
  type: {
    type: String,
    enum: ['email', 'call', 'meeting', 'demo', 'message', 'note', 'other'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  duration: {
    type: Number,
    min: 0
  },
  summary: {
    type: String,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  participants: [{
    name: String,
    email: String,
    role: String
  }],
  followUpDate: {
    type: Date
  },
  followUpAction: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    type: String,
    trim: true
  },
  isPrivate: {
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
interactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to mark follow-up as completed
interactionSchema.methods.completeFollowUp = function() {
  this.completed = true;
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to check if follow-up is due
interactionSchema.methods.isFollowUpDue = function() {
  if (!this.followUpDate || this.completed) {
    return false;
  }
  
  return new Date(this.followUpDate) <= new Date();
};

// Static method to find recent interactions for a client
interactionSchema.statics.findRecentByClient = function(clientId, userId, limit = 5) {
  return this.find({
    clientId,
    userId
  })
  .sort({ date: -1 })
  .limit(limit)
  .lean();
};

// Static method to find pending follow-ups
interactionSchema.statics.findPendingFollowUps = function(userId) {
  const today = new Date();
  
  return this.find({
    userId,
    followUpDate: { $lte: today },
    completed: false
  })
  .sort({ followUpDate: 1 })
  .lean();
};

// Static method to calculate engagement score for a client
interactionSchema.statics.calculateEngagementScore = async function(clientId, userId) {
  // Get interactions from the past 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const interactions = await this.find({
    clientId,
    userId,
    date: { $gte: ninetyDaysAgo }
  }).lean();
  
  if (interactions.length === 0) {
    return {
      score: 0,
      recency: null,
      frequency: 'none',
      sentiment: 'neutral',
      type: {}
    };
  }
  
  // Sort by date (newest first)
  const sortedInteractions = interactions.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Calculate days since most recent interaction
  const mostRecent = sortedInteractions[0];
  const now = new Date();
  const daysSinceLastInteraction = Math.ceil(
    (now - new Date(mostRecent.date)) / (1000 * 60 * 60 * 24)
  );
  
  // Calculate interaction frequency (interactions per month)
  const interactionsPerMonth = (interactions.length / 3); // 3 months period
  
  // Determine frequency category
  let frequency;
  if (interactionsPerMonth >= 4) {
    frequency = 'high';
  } else if (interactionsPerMonth >= 2) {
    frequency = 'medium';
  } else if (interactionsPerMonth >= 1) {
    frequency = 'low';
  } else {
    frequency = 'very_low';
  }
  
  // Calculate sentiment distribution
  const sentimentCounts = interactions.reduce((counts, interaction) => {
    counts[interaction.sentiment] = (counts[interaction.sentiment] || 0) + 1;
    return counts;
  }, {});
  
  // Determine overall sentiment
  let overallSentiment = 'neutral';
  const totalInteractions = interactions.length;
  
  if (sentimentCounts.positive && (sentimentCounts.positive / totalInteractions) > 0.6) {
    overallSentiment = 'positive';
  } else if (sentimentCounts.negative && (sentimentCounts.negative / totalInteractions) > 0.4) {
    overallSentiment = 'negative';
  }
  
  // Count interactions by type
  const typeCounts = interactions.reduce((counts, interaction) => {
    counts[interaction.type] = (counts[interaction.type] || 0) + 1;
    return counts;
  }, {});
  
  // Calculate engagement score
  // Base: 0-100 scale
  let score = 50; // Start at neutral
  
  // Recency factor: penalize for days since last interaction
  if (daysSinceLastInteraction <= 7) {
    score += 20; // Very recent
  } else if (daysSinceLastInteraction <= 14) {
    score += 10; // Recent
  } else if (daysSinceLastInteraction <= 30) {
    // No change
  } else if (daysSinceLastInteraction <= 60) {
    score -= 15; // Somewhat inactive
  } else {
    score -= 30; // Very inactive
  }
  
  // Frequency factor
  if (frequency === 'high') {
    score += 20;
  } else if (frequency === 'medium') {
    score += 10;
  } else if (frequency === 'low') {
    score -= 10;
  } else {
    score -= 20;
  }
  
  // Sentiment factor
  if (overallSentiment === 'positive') {
    score += 10;
  } else if (overallSentiment === 'negative') {
    score -= 10;
  }
  
  // Diversity factor (reward having multiple types of interactions)
  const diversityBonus = Math.min(Object.keys(typeCounts).length * 5, 15);
  score += diversityBonus;
  
  // Ensure score is within 0-100 range
  score = Math.max(0, Math.min(100, score));
  
  return {
    score: Math.round(score),
    recency: daysSinceLastInteraction,
    frequency,
    sentiment: overallSentiment,
    type: typeCounts,
    count: interactions.length
  };
};

// Indexes for optimized queries
interactionSchema.index({ userId: 1, clientId: 1, date: -1 });
interactionSchema.index({ userId: 1, dealId: 1, date: -1 });
interactionSchema.index({ userId: 1, followUpDate: 1, completed: 1 });
interactionSchema.index({ userId: 1, type: 1, date: -1 });
interactionSchema.index({ clientId: 1, date: -1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;