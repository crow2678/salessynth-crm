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
// Enhanced Reddit search function
async function fetchRedditResearch(companyName, clientId, userId) {
    // Get MongoDB client from existing function
    
    try {
        // Check cache/cooldown (keep existing code)
        
        console.log(`🔍 Fetching relevant Reddit discussions for ${companyName}...`);
        
        // Business-focused subreddits
        const businessSubreddits = ['investing', 'stocks', 'finance', 'economy', 'business', 'wallstreetbets'];
        
        // Create exact phrase search query with business context
        const searchQuery = `"${companyName}" (company OR financial OR business)`;
        
        // First try searching across the platform
        let posts = await reddit.search({
            query: searchQuery,
            time: "month",   // Expand to one month
            sort: "relevance", // Prioritize relevance over popularity
            limit: 20        // Get more posts to filter down
        });
        
        // If not enough results, search specific business subreddits
        if (posts.length < 5) {
            const subredditResults = await Promise.all(
                businessSubreddits.map(sub => 
                    reddit.getSubreddit(sub).search({
                        query: `"${companyName}"`,
                        time: "year",
                        sort: "relevance",
                        limit: 5
                    }).catch(e => []) // Handle errors gracefully
                )
            );
            
            // Combine results
            posts = [...posts, ...subredditResults.flat()];
        }
        
        // Filter for relevance
        const companyRegex = new RegExp(`\\b${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const relevantPosts = posts.filter(post => 
            companyRegex.test(post.title) || 
            (post.selftext && companyRegex.test(post.selftext))
        ).slice(0, 5); // Limit to top 5 most relevant
        
        if (relevantPosts.length === 0) {
            console.log(`⚠️ No relevant Reddit discussions found for ${companyName}.`);
            // Update timestamp (keep existing code)
            return [];
        }
        
        // Process and enrich data
        const redditData = relevantPosts.map(post => {
            // Basic sentiment analysis
            const sentiment = post.title.match(/positive|growth|success|profit|up|gains/i) ? 'positive' : 
                             post.title.match(/negative|decline|loss|down|fail|problem/i) ? 'negative' : 'neutral';
            
            return {
                title: post.title,
                url: `https://www.reddit.com${post.permalink}`,
                subreddit: post.subreddit.display_name,
                upvotes: post.ups,
                comments: post.num_comments,
                created: new Date(post.created_utc * 1000).toISOString(),
                snippet: post.selftext ? post.selftext.substring(0, 200) + '...' : 'No text content',
                sentiment: sentiment
            };
        });
        
        // Store in MongoDB (keep existing code)
        
        return redditData;
    } catch (error) {
        console.error(`❌ Error with Reddit research for ${companyName}:`, error.message);
        return [];
    }
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