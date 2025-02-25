const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set random fallback for bcryptjs with synchronous crypto call
const randomBytesSync = (len) => {
  return crypto.randomBytes(len);
};

bcrypt.setRandomFallback(randomBytesSync);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Flight tracking specific fields
  flightTrackingEnabled: {
    type: Boolean,
    default: false
  },
  flightTrackingQuota: {
    type: Number,
    default: 5 // Maximum number of tracked flights
  },
  flightTrackingSettings: {
    refreshInterval: {
      type: Number,
      default: 300, // 5 minutes in seconds
      min: 300,    // Minimum 5 minutes
      max: 3600    // Maximum 1 hour
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      delayThreshold: {
        type: Number,
        default: 15 // Minutes
      },
      types: [{
        type: String,
        enum: ['delay', 'gate_change', 'status_change', 'cancellation'],
        default: ['delay', 'cancellation']
      }]
    },
    lastSyncTime: {
      type: Date,
      default: null
    }
  },
  premiumFeatures: {
    type: Map,
    of: Boolean,
    default: () => new Map([
      ['flightTracking', false],
      ['advancedAnalytics', false],
      ['customReports', false]
    ])
  }
}, {
  // Disable automatic index creation
  autoIndex: false,
  // Minimize empty properties
  minimize: true,
  // Disable versioning
  versionKey: false,
  // Disable timestamps to reduce RU cost
  timestamps: false
});

// Existing password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Use lower salt rounds (8 instead of default 10)
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Existing password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// New methods for flight tracking functionality
userSchema.methods.enableFlightTracking = async function() {
  this.flightTrackingEnabled = true;
  this.premiumFeatures.set('flightTracking', true);
  await this.save();
};

userSchema.methods.disableFlightTracking = async function() {
  this.flightTrackingEnabled = false;
  this.premiumFeatures.set('flightTracking', false);
  await this.save();
};

userSchema.methods.updateFlightTrackingQuota = async function(newQuota) {
  if (newQuota < 0) throw new Error('Quota cannot be negative');
  this.flightTrackingQuota = newQuota;
  await this.save();
};

userSchema.methods.updateNotificationSettings = async function(settings) {
  this.flightTrackingSettings.notifications = {
    ...this.flightTrackingSettings.notifications,
    ...settings
  };
  await this.save();
};

userSchema.methods.hasReachedFlightQuota = async function() {
  const Flight = mongoose.model('Flight');
  const count = await Flight.countDocuments({ userId: this._id });
  return count >= this.flightTrackingQuota;
};

// Add compound index for premium features and flight tracking
userSchema.index({ 
  'flightTrackingEnabled': 1, 
  'isActive': 1 
});

//const User = mongoose.model('User', userSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;