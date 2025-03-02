// server/scripts/add-user.js
const path = require('path');
const dotenv = require('dotenv');

// Resolve path to .env file in parent directory (server root)
const envPath = path.resolve(__dirname, '..', '.env');
console.log('Looking for .env file at:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Debug: Print loaded environment variables (sanitized)
console.log('\nLoaded environment variables:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('NODE_ENV:', process.env.NODE_ENV);

const mongoose = require('mongoose');
const User = require('../models/User');

// Enhanced User Configuration
const NEW_USER = {
  email: 'debi.roy@tavant.com',
  password: 'Iphone@1122',
  firstName: 'Abhay',
  lastName: 'Dubey',
  role: 'user',
  isActive: true,
  flightTrackingEnabled: true,
  flightTrackingQuota: 10,
  flightTrackingSettings: {
    refreshInterval: 3600,
    notifications: {
      enabled: true,
      delayThreshold: 15,
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
    console.log('\nInitializing user creation...');
    
    // Verify MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('MongoDB URI:', process.env.MONGODB_URI.substring(0, 20) + '...');
    console.log('Attempting to connect to MongoDB...');
    
    connection = await mongoose.connect(process.env.MONGODB_URI, cosmosOptions);
    console.log('Connected successfully to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: NEW_USER.email });
    if (existingUser) {
      throw new Error(`User with email ${NEW_USER.email} already exists`);
    }

    // Create new user
    const user = new User(NEW_USER);
    await user.save();

    console.log('\n✅ User created successfully:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'MongoServerError') {
      console.error('MongoDB Error Code:', error.code);
      console.error('MongoDB Error Details:', error.errInfo || error);
    }
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('\nDatabase connection closed');
    }
    process.exit(0);
  }
}

// Run the script
console.log('Starting user creation script...');
addUser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});