// server/scripts/delete-client.js
const path = require('path');
const dotenv = require('dotenv');

// Get client ID from command line argument
const clientIdToDelete = process.argv[2];

if (!clientIdToDelete) {
  console.error("Error: No client ID provided.");
  console.error("Usage: node delete-client.js <client-id>");
  process.exit(1);
}

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
// Use MongoClient directly for operations
const { MongoClient, ObjectId } = require('mongodb');

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

console.log("========== CLIENT DELETION SCRIPT ==========");
console.log("Target client ID:", clientIdToDelete);

async function deleteClientAndResearch() {
  let client;
  try {
    console.log('\nInitializing client deletion...');
    
    // Verify MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('MongoDB URI:', process.env.MONGODB_URI.substring(0, 20) + '...');
    console.log('Attempting to connect to MongoDB...');
    
    // Connect using mongoose (for compatibility with your environment)
    await mongoose.connect(process.env.MONGODB_URI, cosmosOptions);
    console.log('Connected successfully to MongoDB');
    
    // Get native MongoDB client from mongoose connection
    const db = mongoose.connection.db;
    
    // Try first with string ID
    let clientData = await db.collection('clients').findOne({ _id: clientIdToDelete });
    
    // If not found, try with ObjectId
    if (!clientData) {
      try {
        const objectId = new ObjectId(clientIdToDelete);
        clientData = await db.collection('clients').findOne({ _id: objectId });
      } catch (err) {
        // If conversion fails, continue with null clientData
        console.log('Note: Client ID is not a valid ObjectId format');
      }
    }
    
    if (!clientData) {
      console.log("❌ Client not found with ID:", clientIdToDelete);
      return false;
    }
    
    console.log("\nℹ️ Found client:");
    console.log("  • Name:", clientData.name);
    console.log("  • Company:", clientData.company || "N/A");
    console.log("  • Email:", clientData.email || "N/A");
    
    // Check for associated research records
    const researchCount = await db.collection('research').countDocuments({ clientId: clientIdToDelete });
    console.log("ℹ️ Found", researchCount, "associated research records");
    
    // Prompt for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirmation = await new Promise((resolve) => {
      readline.question("\n⚠️  WARNING: You are about to delete this client and all associated research!\nType 'DELETE' to confirm: ", (answer) => {
        readline.close();
        resolve(answer);
      });
    });
    
    if (confirmation !== "DELETE") {
      console.log("Deletion canceled. No changes were made.");
      return false;
    }
    
    console.log("\n🔄 Proceeding with deletion...");
    
    // Delete research records first
    if (researchCount > 0) {
      const researchResult = await db.collection('research').deleteMany({ clientId: clientIdToDelete });
      console.log("✅ Deleted", researchResult.deletedCount, "research records");
    }
    
    // Check for associated tasks (optional)
    const tasksCount = await db.collection('tasks').countDocuments({ clientId: clientIdToDelete });
    if (tasksCount > 0) {
      const taskResult = await db.collection('tasks').deleteMany({ clientId: clientIdToDelete });
      console.log("✅ Deleted", taskResult.deletedCount, "client-related tasks");
    }
    
    // Finally delete the client
    // Use the same ID type (string or ObjectId) that we found the client with
    const clientResult = await db.collection('clients').deleteOne({ _id: clientData._id });
    
    if (clientResult.deletedCount === 1) {
      console.log("✅ Successfully deleted client:", clientIdToDelete);
      return true;
    } else {
      console.log("❌ Failed to delete client despite finding it earlier. This is unexpected.");
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'MongoServerError') {
      console.error('MongoDB Error Code:', error.code);
      console.error('MongoDB Error Details:', error.errInfo || error);
    }
    return false;
  } finally {
    if (mongoose.connection) {
      await mongoose.disconnect();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the script
deleteClientAndResearch()
  .then((result) => {
    if (result) {
      console.log("\n✅ Deletion completed successfully.");
    } else {
      console.log("\n❌ Deletion process encountered issues. Check the logs above.");
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });