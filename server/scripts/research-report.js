// research-report.js
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

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

const mongoose = require('mongoose');

// Cosmos DB Connection options (same as add-user.js)
const cosmosOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false,
  ssl: true,
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000
};

async function generateResearchReport() {
  let connection;
  try {
    console.log('\nInitializing research report generation...');
    
    // Verify MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('MongoDB URI:', process.env.MONGODB_URI.substring(0, 20) + '...');
    console.log('Attempting to connect to MongoDB...');
    
    connection = await mongoose.connect(process.env.MONGODB_URI, cosmosOptions);
    console.log('Connected successfully to MongoDB');

    // Get database connection
    const db = mongoose.connection.db;
    
    // Get collections
    const researchCollection = db.collection('research');
    const userCollection = db.collection('users');
    
    console.log('Finding completed research...');
    
    // Find all research entries with summaries (completed research)
    const completedResearch = await researchCollection.find(
      { summary: { $exists: true, $ne: "" } }
    ).toArray();
    
    console.log(`Found ${completedResearch.length} completed research items`);
    
    // Group by user
    const userResearchMap = {};
    
    for (const research of completedResearch) {
      const userId = research.userId?.toString();
      if (!userId) continue;
      
      if (!userResearchMap[userId]) {
        userResearchMap[userId] = {
          userId: userId,
          researchCount: 0,
          companies: new Set(),
          clients: [],
          lastResearchDate: null
        };
      }
      
      userResearchMap[userId].researchCount++;
      
      if (research.companyName) {
        userResearchMap[userId].companies.add(research.companyName);
      }
      
      // Add client details
      userResearchMap[userId].clients.push({
        clientId: research.clientId,
        company: research.companyName || research.company || "Unknown",
        timestamp: research.timestamp || research.updatedAt || research.createdAt
      });
      
      // Track most recent research
      const timestamp = research.timestamp || research.updatedAt || research.createdAt;
      if (timestamp) {
        const researchDate = new Date(timestamp);
        if (!userResearchMap[userId].lastResearchDate || 
            researchDate > userResearchMap[userId].lastResearchDate) {
          userResearchMap[userId].lastResearchDate = researchDate;
        }
      }
    }
    
    // Get user details
    const userIds = Object.keys(userResearchMap);
    console.log(`Found research for ${userIds.length} unique users`);
    
    const userResults = [];
    
    for (const userId of userIds) {
      try {
        let user = null;
        try {
          // Try objectId first
          const ObjectId = mongoose.Types.ObjectId;
          user = await userCollection.findOne({ _id: new ObjectId(userId) });
        } catch (e) {
          // If that fails, try string ID
          user = await userCollection.findOne({ _id: userId });
        }
        
        if (user) {
          const userStats = userResearchMap[userId];
          userResults.push({
            userId: userId,
            email: user.email || "Unknown",
            name: user.firstName && user.lastName ? 
                 `${user.firstName} ${user.lastName}` : 
                 (user.name || "Unknown"),
            researchCount: userStats.researchCount,
            uniqueCompanies: Array.from(userStats.companies),
            lastResearchDate: userStats.lastResearchDate ? 
                            userStats.lastResearchDate.toISOString() : "Unknown",
            // Sort clients by date (most recent first)
            recentResearch: userStats.clients
              .sort((a, b) => {
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return new Date(b.timestamp) - new Date(a.timestamp);
              })
              .slice(0, 5) // Only show 5 most recent
          });
        } else {
          console.log(`⚠️ User ${userId} not found in database`);
        }
      } catch (err) {
        console.error(`Error finding user ${userId}:`, err.message);
      }
    }
    
    // Sort by most active users (highest research count)
    userResults.sort((a, b) => b.researchCount - a.researchCount);
    
    // Display results
    console.log("\n===== RESEARCH ACTIVITY REPORT =====\n");
    userResults.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - Research Count: ${user.researchCount}`);
      console.log(`   - Unique Companies: ${user.uniqueCompanies.length}`);
      console.log(`   - Last Research: ${user.lastResearchDate}`);
      console.log(`   - Recent Research:`);
      
      user.recentResearch.forEach(item => {
        const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Unknown date";
        console.log(`     * ${item.company} (${date})`);
      });
      
      console.log("");
    });
    
    // Save to file
    const reportFile = `research_report_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(userResults, null, 2));
    console.log(`Full report saved to ${reportFile}`);

  } catch (error) {
    console.error('\n❌ Error generating report:', error.message);
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
console.log('Starting research report generation script...');
generateResearchReport().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});