require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createIndexes() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      ssl: true,
      retryWrites: false
    });
    
    console.log('Creating indexes...');
    
    // Create email index if it doesn't exist
    const collection = User.collection;
    const indexes = await collection.listIndexes().toArray();
    
    if (!indexes.some(index => index.key.email)) {
      console.log('Creating email index...');
      await collection.createIndex(
        { email: 1 },
        { 
          unique: true,
          background: true  // Creates index in background
        }
      );
      console.log('Email index created successfully');
    } else {
      console.log('Email index already exists');
    }

  } catch (error) {
    console.error('Failed to create indexes:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

createIndexes();