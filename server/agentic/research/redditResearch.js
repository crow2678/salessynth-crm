require("dotenv").config();
const snoowrap = require("snoowrap");
const { MongoClient } = require("mongodb");

// Constants
const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = "test";  // Matching with GoogleResearch.js
const COLLECTION_NAME = "research"; // Matching with GoogleResearch.js
const COOLDOWN_PERIOD = 12 * 60 * 60 * 1000; // 12 hours - same as GoogleResearch.js

// 🔹 Initialize Reddit API Client
const reddit = new snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT || "SalesSynthBot/1.0",
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
});

// Create a connection pool instead of new connections for each call
let mongoClient = null;
async function getMongoClient() {
    if (!mongoClient) {
        mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
    }
    return mongoClient;
}

/**
 * Fetch and store Reddit research data for a given company.
 * @param {string} companyName - The name of the company to research.
 * @param {string} clientId - The ID of the client.
 * @param {string} userId - The ID of the user requesting the research.
 * @returns {Promise<Array>} - Array of Reddit posts or empty array if none found.
 */
async function fetchRedditResearch(companyName, clientId, userId) {
    let client = null;
    
    try {
        client = await getMongoClient();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        console.log(`🔍 Checking for existing Reddit research on ${companyName}...`);

        // 🔹 Check if Reddit research already exists and respect cooldown period
        const existingResearch = await collection.findOne({ clientId, userId });
        const now = new Date();
        
        // Add cooldown check similar to GoogleResearch.js
        let lastUpdatedReddit = existingResearch?.lastUpdatedReddit || null;
        if (lastUpdatedReddit && (now - new Date(lastUpdatedReddit)) < COOLDOWN_PERIOD) {
            console.log(`⏳ Reddit research cooldown active for ${companyName}. Skipping API call.`);
            return existingResearch?.data?.reddit || [];
        }

        console.log(`🔍 Fetching top Reddit discussions for ${companyName}...`);

        // 🔹 Fetch top Reddit posts related to the company
        const posts = await reddit.search({
            query: companyName,
            time: "week",   // Search within the last week
            sort: "top",     // Fetch top-ranking posts
            limit: 5         // Get the top 5 relevant posts
        });

        if (!posts || posts.length === 0) {
            console.log(`⚠️ No relevant Reddit discussions found for ${companyName}.`);
            
            // Still update timestamp to respect cooldown period
            await collection.updateOne(
                { clientId, userId },
                {
                    $set: {
                        "lastUpdatedReddit": now,
                    },
                    $setOnInsert: {
                        clientId,
                        userId,
                        companyName
                    }
                },
                { upsert: true }
            );
            
            return [];
        }

        const redditData = posts.map(post => ({
            title: post.title,
            url: `https://www.reddit.com${post.permalink}`, // Use permalink for correct Reddit URL
            subreddit: post.subreddit.display_name,
            upvotes: post.ups,
            comments: post.num_comments,
            created: new Date(post.created_utc * 1000).toISOString() // Convert timestamp to ISO date
        }));

        // 🔹 Store Reddit research in MongoDB, using specific timestamp like GoogleResearch
        await collection.updateOne(
            { clientId, userId },
            { 
                $set: { 
                    "data.reddit": redditData, 
                    "lastUpdatedReddit": now,  // Use Reddit-specific timestamp
                    "clientId": clientId,      // Ensure these fields are set
                    "userId": userId,
                    "companyName": companyName  // Store company name for easier querying
                }
            },
            { upsert: true }
        );

        console.log(`✅ Reddit research stored successfully for ${companyName}.`);

        return redditData;
    } catch (error) {
        console.error(`❌ Error with Reddit research for ${companyName}:`, error.message);
        return [];
    }
    // Don't close the connection here - we're using a shared connection pool
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection due to application termination');
    if (mongoClient) {
        await mongoClient.close();
    }
    process.exit(0);
});

// Maintain backward compatibility by exporting the original function
module.exports = fetchRedditResearch;