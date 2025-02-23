require("dotenv").config();
const snoowrap = require("snoowrap");
const { MongoClient } = require("mongodb");

// 🔹 Initialize Reddit API Client
const reddit = new snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT || "SalesSynthBot/1.0",
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
});

// 🔹 MongoDB Connection
const mongoUrl = process.env.MONGODB_URI;
if (!mongoUrl) {
    throw new Error("❌ MONGODB_URI is not defined. Check .env file.");
}
const client = new MongoClient(mongoUrl);
const dbName = "test";  // Adjust based on your setup
const collectionName = "research";

async function fetchRedditResearch(companyName, clientId, userId) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        console.log(`🔍 Checking for existing Reddit research on ${companyName}...`);

        // 🔹 Check if Reddit research already exists for this client
        const existingResearch = await collection.findOne({
            clientId,
            "data.reddit": { $exists: true }
        });

        if (existingResearch) {
            console.log(`✅ Reddit research already exists for ${companyName}. Skipping API call.`);
            return existingResearch.data.reddit;
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
            return [];
        }

        const redditData = posts.map(post => ({
            title: post.title,
            url: post.url,
            subreddit: post.subreddit.display_name,
            upvotes: post.ups,
            comments: post.num_comments
        }));

        // 🔹 Store Reddit research in CosmosDB
        await collection.updateOne(
            { clientId, userId },
            { 
                $set: { "data.reddit": redditData, lastUpdated: new Date() }
            },
            { upsert: true }
        );

        console.log(`✅ Reddit research stored successfully for ${companyName}.`);

        return redditData;
    } catch (error) {
        console.error(`❌ Error fetching Reddit research for ${companyName}:`, error.message);
        return [];
    } finally {
        await client.close();
    }
}

module.exports = fetchRedditResearch;
