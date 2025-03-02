require("dotenv").config();
const snoowrap = require("snoowrap");
const { MongoClient } = require("mongodb");

// Constants
const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = "test";  // Matching with GoogleResearch.js
const COLLECTION_NAME = "research"; // Matching with GoogleResearch.js
const COOLDOWN_PERIOD = 12 * 60 * 60 * 1000; // 12 hours - same as GoogleResearch.js

// Enhanced financial and business subreddits, ordered by relevance to business discussions
const BUSINESS_SUBREDDITS = [
    // Core financial subreddits
    'investing', 'finance', 'stocks', 'StockMarket', 'Banking', 'FinancialCareers', 
    // Industry-specific subreddits
    'FinTech', 'Economics', 'Entrepreneur', 'Business', 'digitalbanking',
    // Secondary business subreddits
    'wallstreetbets', 'SecurityAnalysis', 'economy', 'CorporateStrategy',
    // Company-specific subreddits may be checked dynamically based on company name
];

// Finance and business keywords to identify relevant content
const FINANCE_KEYWORDS = [
    "earnings", "revenue", "profit", "financial", "stock", "investor", "banking",
    "acquisition", "merger", "investment", "market share", "quarterly", "fiscal",
    "CEO", "executive", "strategy", "partnership", "customer", "product", "launch"
];

// Irrelevant topics to filter out posts about unrelated entities
const IRRELEVANT_KEYWORDS = [
    "player", "game", "movie", "actor", "character", "season", "episode", 
    "book", "author", "team", "scored", "champion", "tournament", "gaming"
];

// Industry keywords mapping for better search context
const INDUSTRY_KEYWORDS = {
    "financial services": ["bank", "financial", "banking", "finance", "loan", "mortgage", "payment", "credit"],
    "healthcare": ["healthcare", "medical", "hospital", "pharma", "drug", "treatment", "patient"],
    "technology": ["tech", "software", "IT", "digital", "app", "platform", "technology", "cloud"],
    "retail": ["retail", "store", "ecommerce", "consumer", "shop", "brand", "merchandise"],
    "manufacturing": ["manufacturing", "factory", "production", "assembly", "industrial"],
    "energy": ["energy", "oil", "gas", "utilities", "power", "renewable", "electricity"]
};

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
 * Get industry-specific context to improve search relevance
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} - Industry if available
 */
async function getIndustryContext(clientId, userId) {
    try {
        const client = await getMongoClient();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        const existingResearch = await collection.findOne(
            { clientId, userId, "data.apollo.companyInfo.industry": { $exists: true } }
        );
        
        if (existingResearch?.data?.apollo?.companyInfo?.industry) {
            return existingResearch.data.apollo.companyInfo.industry;
        }
        return null;
    } catch (err) {
        console.log("⚠️ Could not retrieve industry context");
        return null;
    }
}

/**
 * Create a more specific search query with company and business context
 * @param {string} companyName - Company name
 * @param {string} industry - Industry if available
 * @returns {Object} - Various search queries to try
 */
function createSearchQueries(companyName, industry) {
    // Base exact match query
    const exactQuery = `"${companyName}"`;
    
    // Industry-specific context
    let industryContext = "(company OR business OR corporation)";
    if (industry && INDUSTRY_KEYWORDS[industry.toLowerCase()]) {
        const keywords = INDUSTRY_KEYWORDS[industry.toLowerCase()];
        industryContext = `(${keywords.slice(0, 3).join(" OR ")})`;
    }
    
    // Financial context for banks or financial companies
    if (companyName.toLowerCase().includes("bank") || 
        (industry && industry.toLowerCase().includes("financ"))) {
        industryContext = "(banking OR financial OR finance)";
    }
    
    return {
        // Primary searches - used first
        primary: {
            exactWithBusiness: `${exactQuery} ${industryContext}`,
            exact: exactQuery
        },
        // Secondary fallback searches - used if primary yields insufficient results
        secondary: {
            inexactBusiness: `${companyName} ${industryContext}`,
            news: `${exactQuery} (news OR update OR announce)`,
            recent: `${exactQuery} (2023 OR 2024 OR recent OR latest)`
        }
    };
}

/**
 * Score a post for relevance to our target company
 * @param {Object} post - Reddit post
 * @param {string} companyName - Target company name
 * @param {string} industry - Industry if available
 * @returns {number} - Relevance score (0-100)
 */
function scorePostRelevance(post, companyName, industry) {
    const lowerTitle = post.title.toLowerCase();
    const lowerSelftext = (post.selftext || "").toLowerCase();
    const lowerCompany = companyName.toLowerCase();
    const lowerSubreddit = post.subreddit.display_name.toLowerCase();
    
    let score = 0;
    
    // Exact company name match in title (highest value)
    if (lowerTitle.includes(lowerCompany)) {
        score += 40;
        
        // Bonus if company name is at the beginning of the title
        if (lowerTitle.indexOf(lowerCompany) < 10) {
            score += 10;
        }
    }
    
    // Company name in post body
    if (lowerSelftext.includes(lowerCompany)) {
        score += 20;
    }
    
    // Check if post is in a core business/finance subreddit
    const subredditRank = BUSINESS_SUBREDDITS.indexOf(post.subreddit.display_name);
    if (subredditRank !== -1) {
        // Higher ranked subreddits get more points
        score += Math.max(10, 20 - subredditRank);
    }
    
    // Financial/business terminology appears in title or content
    const contentText = lowerTitle + " " + lowerSelftext;
    let businessTerms = 0;
    
    for (const term of FINANCE_KEYWORDS) {
        if (contentText.includes(term.toLowerCase())) {
            businessTerms++;
        }
    }
    
    // Add points based on how many business terms are present
    if (businessTerms > 0) {
        score += Math.min(20, businessTerms * 5);
    }
    
    // Check for industry-specific keywords if available
    if (industry && INDUSTRY_KEYWORDS[industry.toLowerCase()]) {
        const industryTerms = INDUSTRY_KEYWORDS[industry.toLowerCase()];
        for (const term of industryTerms) {
            if (contentText.includes(term.toLowerCase())) {
                score += 5;
                break; // Only count once
            }
        }
    }
    
    // Penalty for likely irrelevant content
    for (const term of IRRELEVANT_KEYWORDS) {
        if (lowerTitle.includes(term.toLowerCase())) {
            score -= 25; // Significant penalty for irrelevant topics
        }
    }
    
    // Recent posts are more valuable
    const postAge = Date.now() - (post.created_utc * 1000);
    const postDaysOld = postAge / (1000 * 60 * 60 * 24);
    
    if (postDaysOld < 30) {
        score += 10; // Bonus for posts under a month old
    } else if (postDaysOld > 180) {
        score -= 10; // Penalty for posts over 6 months old
    }
    
    // Popular posts (more upvotes/comments) are more valuable
    if (post.ups > 100) {
        score += 5;
    }
    if (post.ups > 1000) {
        score += 5;
    }
    if (post.num_comments > 50) {
        score += 5;
    }
    
    // Ensure score stays in 0-100 range
    return Math.max(0, Math.min(100, score));
}

/**
 * Classify the sentiment of a post more accurately
 * @param {Object} post - Reddit post
 * @returns {string} - 'positive', 'negative', or 'neutral'
 */
function analyzePostSentiment(post) {
    const title = post.title.toLowerCase();
    const selftext = (post.selftext || "").toLowerCase();
    const content = title + " " + selftext;
    
    // Positive financial terms
    const positiveTerms = [
        "growth", "profit", "success", "up", "gains", "increase", "rise", "growing",
        "exceeded", "beat", "positive", "promising", "opportunity", "partnership",
        "launch", "innovative", "expansion", "improved", "strong", "outperform"
    ];
    
    // Negative financial terms
    const negativeTerms = [
        "decline", "loss", "down", "fail", "problem", "risk", "drop", "fell",
        "negative", "weak", "disappointing", "missed", "below", "concern",
        "investigation", "lawsuit", "cut", "trouble", "layoff", "challenge"
    ];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    // Count positive terms
    for (const term of positiveTerms) {
        // Use regex with word boundaries to match whole words
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
            positiveCount += matches.length;
        }
    }
    
    // Count negative terms
    for (const term of negativeTerms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
            negativeCount += matches.length;
        }
    }
    
    // Determine sentiment based on the balance
    if (positiveCount > negativeCount + 1) {
        return "positive";
    } else if (negativeCount > positiveCount + 1) {
        return "negative";
    } else {
        return "neutral";
    }
}

/**
 * Fetch and store Reddit research data for a given company.
 * @param {string} companyName - The name of the company to research.
 * @param {string} clientId - The ID of the client.
 * @param {string} userId - The ID of the user requesting the research.
 * @returns {Promise<Array>} - Array of Reddit posts or empty array if none found.
 */
async function fetchRedditResearch(companyName, clientId, userId) {
    try {
        console.log(`🔍 Fetching relevant Reddit discussions for ${companyName}...`);
        
        // Get industry context if available
        const industry = await getIndustryContext(clientId, userId);
        if (industry) {
            console.log(`📊 Using industry context: ${industry}`);
        }
        
        // Generate search queries with various levels of specificity
        const searchQueries = createSearchQueries(companyName, industry);
        console.log(`🔍 Primary search query: ${searchQueries.primary.exactWithBusiness}`);
        
        // Execute primary searches first
        let allPosts = [];
        
        // Try with business context first
        let primaryPosts = await reddit.search({
            query: searchQueries.primary.exactWithBusiness,
            time: "year",
            sort: "relevance",
            limit: 20
        }).catch(e => {
            console.log(`⚠️ Error with primary search: ${e.message}`);
            return [];
        });
        
        // If not enough results, try exact company name
        if (primaryPosts.length < 10) {
            const exactPosts = await reddit.search({
                query: searchQueries.primary.exact,
                time: "year",
                sort: "relevance",
                limit: 20
            }).catch(e => {
                console.log(`⚠️ Error with exact search: ${e.message}`);
                return [];
            });
            
            // Combine unique posts
            primaryPosts = [...primaryPosts, ...exactPosts];
            
            // Remove duplicates by id
            primaryPosts = Array.from(new Map(primaryPosts.map(post => [post.id, post])).values());
        }
        
        allPosts = [...primaryPosts];
        
        // If we still need more results, try secondary searches
        if (allPosts.length < 10) {
            console.log(`🔍 Using secondary search strategies for ${companyName}...`);
            
            // Execute each secondary search strategy
            for (const [strategy, query] of Object.entries(searchQueries.secondary)) {
                const secondaryPosts = await reddit.search({
                    query: query,
                    time: "year",
                    sort: "relevance",
                    limit: 10
                }).catch(e => {
                    console.log(`⚠️ Error with ${strategy} search: ${e.message}`);
                    return [];
                });
                
                allPosts = [...allPosts, ...secondaryPosts];
                
                // If we have enough posts, break early
                if (allPosts.length >= 20) break;
            }
            
            // Remove duplicates by id
            allPosts = Array.from(new Map(allPosts.map(post => [post.id, post])).values());
        }
        
        // Search specific financial subreddits for our company
        const financialSubreddits = BUSINESS_SUBREDDITS.slice(0, 7); // Top financial subreddits
        
        await Promise.all(financialSubreddits.map(async (sub) => {
            try {
                const subredditPosts = await reddit.getSubreddit(sub).search({
                    query: searchQueries.primary.exact,
                    time: "year",
                    sort: "relevance",
                    limit: 5
                });
                
                allPosts = [...allPosts, ...subredditPosts];
            } catch (e) {
                // Silently handle errors for individual subreddits
            }
        }));
        
        // Remove duplicates by id
        allPosts = Array.from(new Map(allPosts.map(post => [post.id, post])).values());
        
        // Score posts for relevance
        const scoredPosts = allPosts.map(post => {
            const relevanceScore = scorePostRelevance(post, companyName, industry);
            return { post, relevanceScore };
        });
        
        // Filter by relevance score and sort by most relevant
        const MIN_RELEVANCE_SCORE = 40;
        const filteredPosts = scoredPosts
            .filter(item => item.relevanceScore >= MIN_RELEVANCE_SCORE)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5);
        
        if (filteredPosts.length === 0) {
            console.log(`⚠️ No relevant Reddit discussions found for ${companyName}.`);
            
            // Update only the timestamp fields for Reddit
            const client = await getMongoClient();
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);
            const now = new Date();
            
            await collection.updateOne(
                { clientId, userId },
                {
                    $set: {
                        "lastUpdatedReddit": now,
                        "lastUpdated.reddit": now
                    },
                    $setOnInsert: {
                        clientId,
                        userId,
                        companyName,
                        company: companyName
                    }
                },
                { upsert: true }
            );
            
            // If we found posts but none were relevant enough, take the top 3 anyway
            if (scoredPosts.length > 0) {
                console.log(`⚠️ Using top posts despite low relevance scores`);
                
                const fallbackPosts = scoredPosts
                    .sort((a, b) => b.relevanceScore - a.relevanceScore)
                    .slice(0, 3)
                    .map(item => item.post);
                
                // Process and enrich these fallback posts
                const redditData = fallbackPosts.map(post => {
                    return {
                        title: post.title,
                        url: `https://www.reddit.com${post.permalink}`,
                        subreddit: post.subreddit.display_name,
                        upvotes: post.ups,
                        comments: post.num_comments,
                        created: new Date(post.created_utc * 1000).toISOString(),
                        snippet: post.selftext ? post.selftext.substring(0, 200) + '...' : 'No text content',
                        sentiment: analyzePostSentiment(post),
                        relevance: "low"  // Mark these as low relevance
                    };
                });
                
                // Store the fallback data
                await collection.updateOne(
                    { clientId, userId },
                    {
                        $set: {
                            "data.reddit": redditData,
                            "lastUpdatedReddit": now,
                            "lastUpdated.reddit": now,
                            "companyName": companyName,
                            "company": companyName
                        },
                        $setOnInsert: {
                            clientId,
                            userId
                        }
                    },
                    { upsert: true }
                );
                
                console.log(`✅ Stored ${redditData.length} fallback Reddit posts for ${companyName}`);
                return redditData;
            }
            
            return [];
        }
        
        // Process the relevant posts
        const redditData = filteredPosts.map(item => {
            const post = item.post;
            return {
                title: post.title,
                url: `https://www.reddit.com${post.permalink}`,
                subreddit: post.subreddit.display_name,
                upvotes: post.ups,
                comments: post.num_comments,
                created: new Date(post.created_utc * 1000).toISOString(),
                snippet: post.selftext ? post.selftext.substring(0, 200) + '...' : 'No text content',
                sentiment: analyzePostSentiment(post),
                relevance: item.relevanceScore > 70 ? "high" : "medium"
            };
        });
        
        // Store in MongoDB with field-specific update
        const client = await getMongoClient();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        const now = new Date();
        
        await collection.updateOne(
            { clientId, userId },
            {
                $set: {
                    "data.reddit": redditData,
                    "lastUpdatedReddit": now,
                    "lastUpdated.reddit": now,
                    "companyName": companyName,
                    "company": companyName
                },
                $setOnInsert: {
                    clientId,
                    userId
                }
            },
            { upsert: true }
        );
        
        console.log(`✅ Stored ${redditData.length} Reddit posts for ${companyName}`);
        
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