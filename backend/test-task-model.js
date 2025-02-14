require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
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

async function testTaskModel() {
  let testUser = null;
  let testTask = null;

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

    // Create test task
    await safeOperation(async () => {
      testTask = new Task({
        userId: testUser._id,
        title: 'Test Task',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      });
      await testTask.save();
    }, 'Task creation');

    // Test finding task by userId
    await safeOperation(async () => {
      const foundTask = await Task.findOne({ userId: testUser._id });
      if (!foundTask) throw new Error('Task not found');
      console.log('Found task:', foundTask.title);
    }, 'Task retrieval');

    // Test completing task
    await safeOperation(async () => {
      testTask.completed = true;
      await testTask.save();
      const updatedTask = await Task.findById(testTask._id);
      if (!updatedTask.completedAt) throw new Error('completedAt not set');
      console.log('Task completed and completedAt timestamp set');
    }, 'Task completion');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    // Cleanup
    if (testTask) {
      await safeOperation(async () => {
        await Task.deleteOne({ _id: testTask._id });
      }, 'Task cleanup').catch(console.error);
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
console.log('🚀 Starting Task Model Tests...\n');
testTaskModel();