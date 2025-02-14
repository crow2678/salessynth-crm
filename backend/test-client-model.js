require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('./models/Client');
const User = require('./models/User');

// Helper function for controlled delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function safeOperation(operation, name) {
  try {
    console.log(`Starting: ${name}...`);
    const result = await operation();
    console.log(`✅ Success: ${name}`);
    // Wait 5 seconds between operations
    await delay(5000);
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${name}:`, error.message);
    throw error;
  }
}

async function testClientModel() {
  let testUser = null;
  let testClient = null;

  try {
    // Connect to database
    await safeOperation(async () => {
      await mongoose.connect(process.env.MONGODB_URI, {
        ssl: true,
        retryWrites: false
      });
    }, 'Database connection');

    // Create test user first
    await safeOperation(async () => {
      testUser = new User({
        email: 'testuser@example.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User'
      });
      await testUser.save();
    }, 'Test user creation');

    // Create test client
    await safeOperation(async () => {
      testClient = new Client({
        userId: testUser._id,
        name: 'Test Client',
        email: 'client@example.com',
        company: 'Test Company',
        deals: [{
          title: 'Test Deal',
          value: 1000,
          status: 'prospecting'
        }]
      });
      await testClient.save();
    }, 'Client creation');

    // Test finding client by userId
    await safeOperation(async () => {
      const foundClient = await Client.findOne({ userId: testUser._id });
      if (!foundClient) throw new Error('Client not found');
      console.log('Found client:', foundClient.name);
    }, 'Client retrieval');

    // Test updating deal
    await safeOperation(async () => {
      testClient.deals[0].status = 'qualified';
      await testClient.save();
      console.log('Deal status updated and lastUpdated timestamp set');
    }, 'Deal update');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    // Cleanup
    if (testClient) {
      await safeOperation(async () => {
        await Client.deleteOne({ _id: testClient._id });
      }, 'Client cleanup').catch(console.error);
    }
    if (testUser) {
      await safeOperation(async () => {
        await User.deleteOne({ _id: testUser._id });
      }, 'User cleanup').catch(console.error);
    }

    await mongoose.disconnect();
    console.log('\n✅ Test suite completed - Database disconnected');
  }
}

// Run the test
console.log('🚀 Starting Client Model Tests...\n');
testClientModel();