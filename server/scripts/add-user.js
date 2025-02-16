// server/scripts/add-user.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Enhanced User Configuration
const NEW_USER = {
  email: 'packer2009@gmail.com',    // Replace with actual email
  password: 'Iphone@1122',          // Replace with actual password
  firstName: 'John',                // Replace with actual first name
  lastName: 'doe',                  // Replace with actual last name
  role: 'user',                     // 'admin' or 'user'
  isActive: true,
  // Premium features configuration
  flightTrackingEnabled: true,      // Enable/disable flight tracking
  flightTrackingQuota: 10,         // Number of flights user can track
  flightTrackingSettings: {
    refreshInterval: 3600,           // 5 minutes in seconds
    notifications: {
      enabled: true,
      delayThreshold: 15,          // Minutes
      types: ['delay', 'gate_change', 'status_change', 'cancellation']
    }
  },
  premiumFeatures: {
    flightTracking: true,
    advancedAnalytics: false,
    customReports: false
  }
};

// Cosmos DB Connection options
const cosmosOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false,
  ssl: true,
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000
};

async function addUser() {
  let connection;
  try {
    console.log('Initializing user creation...');
    console.log('Connecting to Cosmos DB...');
    
    connection = await mongoose.connect(process.env.MONGODB_URI, cosmosOptions);
    console.log('Connected successfully to Cosmos DB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: NEW_USER.email });
    if (existingUser) {
      throw new Error(`User with email ${NEW_USER.email} already exists`);
    }

    // Create new user
    const user = new User(NEW_USER);

    // Save user to database
    await user.save();

    console.log('✅ User created successfully:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      premiumStatus: {
        flightTracking: {
          enabled: user.flightTrackingEnabled,
          quota: user.flightTrackingQuota
        },
        premiumFeatures: user.premiumFeatures
      }
    });

    // Log premium features status
    console.log('\nPremium Features Configuration:');
    console.log('--------------------------------');
    console.log('Flight Tracking:', user.flightTrackingEnabled ? 'Enabled' : 'Disabled');
    console.log('Flight Quota:', user.flightTrackingQuota);
    console.log('Refresh Interval:', `${user.flightTrackingSettings.refreshInterval} seconds`);
    console.log('Notifications:', user.flightTrackingSettings.notifications.enabled ? 'Enabled' : 'Disabled');
    console.log('Alert Types:', user.flightTrackingSettings.notifications.types.join(', '));

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    if (error.code === 11000) {
      console.error('User with this email already exists');
    }
  } finally {
    // Close database connection
    if (connection) {
      await mongoose.disconnect();
      console.log('Database connection closed');
    }
  }
}

// Run the script
console.log('Starting user creation script...');
addUser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});