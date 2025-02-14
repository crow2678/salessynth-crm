const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Task = require('../models/Task');
const Bookmark = require('../models/Bookmark');

const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || 'admin@salessynth.com',
  password: process.env.ADMIN_PASSWORD,
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  isActive: true
};

// Cosmos DB Connection options
const cosmosOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false,
  ssl: true,
  maxPoolSize: 5,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 360000
};

async function migrateToAdmin() {
  try {
    console.log('Starting admin user migration for Cosmos DB...');
    console.log('Script location:', __dirname);

    // Validate environment
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    if (!ADMIN_CONFIG.password) {
      throw new Error('ADMIN_PASSWORD environment variable is required');
    }

    // Connect to Cosmos DB
    await mongoose.connect(process.env.MONGODB_URI, cosmosOptions);
    console.log('✅ Connected to Cosmos DB');

    // Check if admin user exists
    let adminUser = await User.findOne({ email: ADMIN_CONFIG.email });
    
    if (!adminUser) {
      try {
        // Create admin user
        adminUser = await User.create(ADMIN_CONFIG);
        console.log('✅ Admin user created successfully');
      } catch (error) {
        if (error.code === 11000) { // Duplicate key error
          adminUser = await User.findOne({ email: ADMIN_CONFIG.email });
          console.log('ℹ️ Retrieved existing admin user');
        } else {
          throw error;
        }
      }
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Migrate data in batches
    const batchSize = 100;

    // Migrate Clients
    const clientCount = await Client.countDocuments({ userId: { $exists: false } });
    if (clientCount > 0) {
      let processedClients = 0;
      while (processedClients < clientCount) {
        const clients = await Client.find({ userId: { $exists: false } })
          .limit(batchSize);
        
        for (const client of clients) {
          try {
            client.userId = adminUser._id;
            await client.save();
            processedClients++;
          } catch (error) {
            console.error(`Error migrating client ${client._id}:`, error.message);
          }
        }
        console.log(`✅ Migrated ${processedClients}/${clientCount} clients`);
        
        if (processedClients < clientCount) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      console.log('ℹ️ No clients to migrate');
    }

    // Migrate Tasks
    const taskCount = await Task.countDocuments({ userId: { $exists: false } });
    if (taskCount > 0) {
      let processedTasks = 0;
      while (processedTasks < taskCount) {
        const tasks = await Task.find({ userId: { $exists: false } })
          .limit(batchSize);
        
        for (const task of tasks) {
          try {
            task.userId = adminUser._id;
            await task.save();
            processedTasks++;
          } catch (error) {
            console.error(`Error migrating task ${task._id}:`, error.message);
          }
        }
        console.log(`✅ Migrated ${processedTasks}/${taskCount} tasks`);
        
        if (processedTasks < taskCount) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      console.log('ℹ️ No tasks to migrate');
    }

    // Migrate Bookmarks
    const bookmarkCount = await Bookmark.countDocuments({ userId: { $exists: false } });
    if (bookmarkCount > 0) {
      let processedBookmarks = 0;
      while (processedBookmarks < bookmarkCount) {
        const bookmarks = await Bookmark.find({ userId: { $exists: false } })
          .limit(batchSize);
        
        for (const bookmark of bookmarks) {
          try {
            bookmark.userId = adminUser._id;
            await bookmark.save();
            processedBookmarks++;
          } catch (error) {
            console.error(`Error migrating bookmark ${bookmark._id}:`, error.message);
          }
        }
        console.log(`✅ Migrated ${processedBookmarks}/${bookmarkCount} bookmarks`);
        
        if (processedBookmarks < bookmarkCount) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      console.log('ℹ️ No bookmarks to migrate');
    }

    console.log('🎉 Migration completed successfully');

    // Print admin credentials (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('\nAdmin Credentials (DEV ONLY):');
      console.log(`Email: ${ADMIN_CONFIG.email}`);
      console.log('\nWARNING: Use the password set in your environment variables');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from Cosmos DB');
  }
}

// Run migration
if (require.main === module) {
  migrateToAdmin().catch(err => {
    console.error('Fatal error during migration:', err);
    process.exit(1);
  });
}

module.exports = migrateToAdmin;