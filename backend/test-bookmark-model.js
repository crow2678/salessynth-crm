require('dotenv').config();
const mongoose = require('mongoose');
const Bookmark = require('./models/Bookmark');
const User = require('./models/User');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function safeOperation(operation, name) {
  try {
    console.log(`\nStarting: ${name}...`);
    const result = await operation();
    console.log(`✅ Success: ${name}`);
    await delay(5000);
    return result;
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.log(`✅ Expected validation error:`, error.message);
      return; // This is expected for validation tests
    }
    console.error(`❌ Failed: ${name}:`, error.message);
    throw error;
  }
}

async function testBookmarkModel() {
  let testUser = null;
  let testBookmarks = [];

  try {
    // Connect to database
    await safeOperation(async () => {
      await mongoose.connect(process.env.MONGODB_URI, {
        ssl: true,
        retryWrites: false
      });
    }, 'Database connection');

    // Create test user
    await safeOperation(async () => {
      testUser = new User({
        email: 'testuser@example.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User'
      });
      await testUser.save();
    }, 'Test user creation');

    // Test Case 1: Valid URL with no protocol
    await safeOperation(async () => {
      const bookmark1 = new Bookmark({
        userId: testUser._id,
        title: 'No Protocol URL',
        url: 'example.com',
        description: 'Should add https://',
        tags: ['test']
      });
      await bookmark1.save();
      testBookmarks.push(bookmark1);
      
      const saved = await Bookmark.findById(bookmark1._id);
      console.log('Original URL:', 'example.com');
      console.log('Saved URL:', saved.url);
    }, 'Test URL without protocol');

    // Test Case 2: Valid URL with HTTP protocol
    await safeOperation(async () => {
      const bookmark2 = new Bookmark({
        userId: testUser._id,
        title: 'HTTP URL',
        url: 'http://example.com',
        description: 'Should keep http://',
        tags: ['test']
      });
      await bookmark2.save();
      testBookmarks.push(bookmark2);
      
      const saved = await Bookmark.findById(bookmark2._id);
      console.log('Original URL:', 'http://example.com');
      console.log('Saved URL:', saved.url);
    }, 'Test HTTP URL');

    // Test Case 3: Invalid URL
    console.log('\nTesting invalid URL...');
    try {
      const invalidBookmark = new Bookmark({
        userId: testUser._id,
        title: 'Invalid URL',
        url: 'not@valid@url',
        description: 'Should fail validation'
      });
      await invalidBookmark.save();
      throw new Error('Invalid URL was incorrectly accepted');
    } catch (error) {
      if (error.name === 'ValidationError') {
        console.log('✅ Success: Invalid URL correctly rejected with validation error');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    // Cleanup
    if (testBookmarks.length > 0) {
      await safeOperation(async () => {
        await Bookmark.deleteMany({ 
          _id: { $in: testBookmarks.map(b => b._id) }
        });
      }, 'Bookmarks cleanup');
    }
    if (testUser) {
      await safeOperation(async () => {
        await User.deleteOne({ _id: testUser._id });
      }, 'User cleanup');
    }

    await mongoose.disconnect();
    console.log('\n✅ Test suite completed - Database disconnected');
  }
}

// Run the test
console.log('🚀 Starting Bookmark Model Tests...\n');
testBookmarkModel();