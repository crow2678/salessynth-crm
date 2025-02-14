require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function backupCollection(Model, filename) {
  try {
    // Use lean() for better performance with large datasets
    const data = await Model.find({}).lean();
    
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)){
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(backupDir, `${filename}_${timestamp}.json`);
    
    // Write in chunks for large datasets
    const writeStream = fs.createWriteStream(filePath);
    writeStream.write('[\n');
    
    for (let i = 0; i < data.length; i++) {
      writeStream.write(JSON.stringify(data[i], null, 2));
      if (i < data.length - 1) writeStream.write(',\n');
    }
    
    writeStream.write('\n]');
    writeStream.end();
    
    console.log(`✅ Backed up ${data.length} documents to ${filePath}`);
    return data.length;
  } catch (error) {
    console.error(`❌ Error backing up collection:`, error);
    throw error;
  }
}

async function backupDatabase() {
  try {
    console.log('🚀 Starting backup process...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      retryWrites: false
    });

    const collections = {
      clients: require('./models/Client'),
      tasks: require('./models/Task'),
      bookmarks: require('./models/Bookmark')
    };

    for (const [name, Model] of Object.entries(collections)) {
      console.log(`📦 Backing up ${name}...`);
      await backupCollection(Model, name);
    }

  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Backup process completed');
  }
}

backupDatabase();