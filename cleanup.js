const mongoose = require('mongoose');
require('dotenv').config();

const Client = require('./models/Client');
const Bookmark = require('./models/Bookmark');
const Task = require('./models/Task');

async function cleanupDatabase() {
  try {
    console.log('Starting database cleanup...');

    // Delete all collections
    const collections = [Client, Bookmark, Task];
    
    for (const Collection of collections) {
      const count = await Collection.countDocuments();
      console.log(`Deleting ${count} documents from ${Collection.modelName}...`);
      
      try {
        await Collection.deleteMany({});
        console.log(`✅ Successfully deleted all ${Collection.modelName} documents`);
      } catch (error) {
        console.error(`❌ Error deleting ${Collection.modelName} documents:`, error.message);
      }
    }

    // Drop indexes
    for (const Collection of collections) {
      try {
        await Collection.collection.dropIndexes();
        console.log(`✅ Successfully dropped indexes for ${Collection.modelName}`);
      } catch (error) {
        console.error(`❌ Error dropping indexes for ${Collection.modelName}:`, error.message);
      }
    }

    console.log('🎉 Database cleanup completed successfully');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Connect to database and run cleanup
console.log('Connecting to database...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to database');
    return cleanupDatabase();
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });