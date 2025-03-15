const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'prospecting'
  },
  expectedCloseDate: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  products: [{
    name: String,
    quantity: Number,
    unitPrice: Number
  }],
  contactHistory: [{
    type: {
      type: String,
      enum: ['email', 'call', 'meeting', 'demo', 'other'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    outcome: String
  }],
  stageHistory: [{
    stage: {
      type: String,
      enum: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
      required: true
    },
    enteredAt: {
      type: Date,
      default: Date.now
    },
    exitedAt: {
      type: Date
    },
    durationDays: {
      type: Number
    },
    notes: String
  }],
  predictions: [{
    predictedAt: {
      type: Date,
      default: Date.now
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    predictedCloseDate: {
      type: Date
    },
    predictedStage: {
      type: String,
      enum: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
    },
    factors: {
      positive: [String],
      negative: [String]
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    stageEstimates: [{
      stage: String,
      estimatedDays: Number
    }],
    timeToCloseEstimate: Number,
    actualOutcome: {
      type: String,
      enum: ['pending', 'accurate', 'inaccurate'],
      default: 'pending'
    },
    source: {
      type: String,
      enum: ['ai', 'user', 'system'],
      default: 'system'
    },
    dataSources: [String]
  }],
  competitors: [{
    name: String,
    strengths: [String],
    weaknesses: [String],
    differentiators: [String]
  }],
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
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

// Update timestamps middleware
dealSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update stage history if status changed
  if (this.isModified('status')) {
    // Close previous stage
    if (this.stageHistory && this.stageHistory.length > 0) {
      const currentStageIndex = this.stageHistory.findIndex(
        s => s.stage === this.status && !s.exitedAt
      );
      
      // If we're already in this stage, don't create a new entry
      if (currentStageIndex >= 0) {
        next();
        return;
      }
      
      const lastStage = this.stageHistory[this.stageHistory.length - 1];
      if (lastStage && !lastStage.exitedAt) {
        const now = new Date();
        lastStage.exitedAt = now;
        const enteredAt = new Date(lastStage.enteredAt);
        const durationMs = now - enteredAt;
        lastStage.durationDays = parseFloat((durationMs / (1000 * 60 * 60 * 24)).toFixed(1));
      }
    }
    
    // Add new stage to history
    const newStage = {
      stage: this.status,
      enteredAt: new Date()
    };
    
    if (!this.stageHistory) {
      this.stageHistory = [];
    }
    
    this.stageHistory.push(newStage);
    
    // Set closedAt date if deal is closed
    if (this.status === 'closed_won' || this.status === 'closed_lost') {
      this.closedAt = new Date();
    } else {
      this.closedAt = undefined;
    }
  }
  
  next();
});

// Mongoose model method to calculate stage metrics
dealSchema.methods.calculateStageMetrics = function() {
  if (!this.stageHistory || this.stageHistory.length === 0) {
    return {
      totalDuration: 0,
      averageStageDuration: 0,
      currentStageDuration: 0,
      stageVelocity: 0
    };
  }
  
  // Calculate total duration across all stages
  let totalDuration = 0;
  let completedStages = 0;
  
  this.stageHistory.forEach(stage => {
    if (stage.durationDays) {
      totalDuration += stage.durationDays;
      completedStages++;
    }
  });
  
  // Calculate current stage duration
  const currentStage = this.stageHistory.find(s => s.stage === this.status && !s.exitedAt);
  let currentStageDuration = 0;
  
  if (currentStage) {
    const now = new Date();
    const enteredAt = new Date(currentStage.enteredAt);
    currentStageDuration = parseFloat((
      (now - enteredAt) / (1000 * 60 * 60 * 24)
    ).toFixed(1));
  }
  
  // Calculate average duration and velocity
  const averageStageDuration = completedStages > 0 ? 
    parseFloat((totalDuration / completedStages).toFixed(1)) : 0;
    
  const firstStageDate = new Date(this.stageHistory[0].enteredAt);
  const totalDealDays = parseFloat((
    (new Date() - firstStageDate) / (1000 * 60 * 60 * 24)
  ).toFixed(1));
  
  const stageVelocity = totalDealDays > 0 ? 
    parseFloat(((this.stageHistory.length - 1) / totalDealDays * 30).toFixed(2)) : 0;
  
  return {
    totalDuration: parseFloat(totalDuration.toFixed(1)),
    averageStageDuration,
    currentStageDuration,
    stageVelocity,
    totalDealDays
  };
};

// Method to get the latest prediction
dealSchema.methods.getLatestPrediction = function() {
  if (!this.predictions || this.predictions.length === 0) {
    return null;
  }
  
  return this.predictions.sort(
    (a, b) => new Date(b.predictedAt) - new Date(a.predictedAt)
  )[0];
};

// Optimize indexes for frequent queries
dealSchema.index({ userId: 1, status: 1 });
dealSchema.index({ userId: 1, clientId: 1 });
dealSchema.index({ userId: 1, value: -1 });
dealSchema.index({ userId: 1, createdAt: -1 });
dealSchema.index({ userId: 1, updatedAt: -1 });

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;