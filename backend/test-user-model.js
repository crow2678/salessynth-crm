require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Helper function for controlled delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function safeOperation(operation, name) {
  try {
    console.log(`Starting: ${name}...`);
    const result = await operation();
    console.log(`✅ Success: ${name}`);
    // Wait 5 seconds between operations to ensure RU availability
    await delay(5000);
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${name}`, error.message);
    throw error;
  }
}

async function testUserModel() {
  let testUser = null;

  try {
    // Connect to database
    await safeOperation(async () => {
      await mongoose.connect(process.env.MONGODB_URI, {
        ssl: true,
        retryWrites: false
      });
    }, 'Database connection');

    // Clean up any existing test user
    await safeOperation(async () => {
      const existingUser = await User.findOne({ email: 'test@example.com' });
      if (existingUser) {
        await User.deleteOne({ email: 'test@example.com' });
        console.log('Cleaned up existing test user');
      }
    }, 'Cleanup check');

    // Create test user
    await safeOperation(async () => {
      testUser = new User({
        email: 'test@example.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User'
      });
      await testUser.save();
    }, 'User creation');

    // Verify password hashing
    await safeOperation(async () => {
      const isMatch = await testUser.comparePassword('testpass123');
      if (!isMatch) throw new Error('Password verification failed');
    }, 'Password verification');

    // Read test
    await safeOperation(async () => {
      const foundUser = await User.findOne({ email: 'test@example.com' });
      if (!foundUser) throw new Error('User not found');
    }, 'User retrieval');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    
    if (error.message.includes('throughput limit')) {
      console.log('\n💡 RU Limit Tips:');
      console.log('- Current operation exceeded the 400 RU/s limit');
      console.log('- Wait a few minutes before retrying');
      console.log('- Consider running tests individually');
    }
  } finally {
    // Cleanup
    if (testUser && testUser._id) {
      await safeOperation(async () => {
        await User.deleteOne({ email: 'test@example.com' });
      }, 'Final cleanup').catch(console.error);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Test suite completed - Database disconnected');
  }
}

// Run the test
console.log('🚀 Starting User Model Tests with RU optimization...\n');
testUserModel();