const axios = require("axios");
const { MongoClient } = require("mongodb");
require("dotenv").config();

// Constants
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_URL = "https://serpapi.com/search.json";
const MONGO_URI = process.env.MONGODB_URI;
const COOLDOWN_PERIOD = 12 * 60 * 60 * 1000; // 12 hours
const DB_NAME = "test";
const COLLECTION_NAME = "research";

// Industry keywords mapping for better search context
const INDUSTRY_KEYWORDS = {
    "financial services": ["bank", "financial", "banking", "finance"],
    "healthcare": ["healthcare", "medical", "hospital", "pharma"],
    "technology": ["tech", "software", "IT", "digital"],
    "retail": ["retail", "store", "ecommerce", "consumer"],
    "manufacturing": ["manufacturing", "factory", "production"],
    "energy": ["energy", "oil", "gas", "utilities"]
};

// Common company name suffixes to help with disambiguation
const COMPANY_SUFFIXES = ["Bank", "Inc", "Corp", "LLC", "Ltd", "Limited", "Group", "Holdings", "PLC", "Company"];

// Common irrelevant keywords that might indicate unrelated content
const IRRELEVANT_KEYWORDS = ["player", "athlete", "actor", "movie", "character", "game"];

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
 * Construct a better search query with industry context and disambiguation
 * @param {string} companyName - The company name
 * @param {string} industry - The company's industry (if known)
 * @returns {string} - Enhanced search query
 */
function constructSearchQuery(companyName, industry = "") {
    // Basic sanitization - remove any special characters
    const sanitizedName = companyName.replace(/[^\w\s]/gi, '');
    
    // Check if company name already includes common suffixes
    const hasSuffix = COMPANY_SUFFIXES.some(suffix => 
        companyName.toLowerCase().includes(suffix.toLowerCase()));
    
    // Build disambiguation terms
    let disambiguationTerms = "";
    
    // Add industry context if available
    if (industry && INDUSTRY_KEYWORDS[industry.toLowerCase()]) {
        const relevantKeywords = INDUSTRY_KEYWORDS[industry.toLowerCase()];
        disambiguationTerms += ` (${relevantKeywords.join(" OR ")})`;
    } else if (!hasSuffix) {
        // If no industry and no suffix, add common business terms
        disambiguationTerms += " (company OR business OR corporation)";
    }
    
    // For financial institutions, add special case handling
    if (companyName.toLowerCase().includes("bank") || 
        (industry && industry.toLowerCase().includes("financ"))) {
        disambiguationTerms += " (banking OR financial OR finance)";
    }
    
    // For common company names that might be ambiguous
    if (companyName.length < 8) {
        disambiguationTerms += " business";
    }
    
    // Build the final query with company name in quotes for exact matching
    return `"${sanitizedName}"${disambiguationTerms} latest news`;
}

/**
 * Score an article for relevance to the target company
 * @param {Object} article - News article
 * @param {string} companyName - Target company name
 * @param {string} industry - Company's industry (if known)
 * @returns {number} - Relevance score (0-100)
 */
function scoreArticleRelevance(article, companyName, industry = "") {
    let score = 0;
    const title = article.title || "";
    const snippet = article.snippet || "";
    const source = article.source?.name || "";
    
    // Convert to lowercase for case-insensitive matching
    const lowerTitle = title.toLowerCase();
    const lowerSnippet = snippet.toLowerCase();
    const lowerCompany = companyName.toLowerCase();
    const lowerSource = source.toLowerCase();
    
    // Check for exact company name in title (highest relevance)
    if (lowerTitle.includes(lowerCompany)) {
        score += 40;
        
        // Bonus for company name at beginning of title
        if (lowerTitle.startsWith(lowerCompany)) {
            score += 10;
        }
    }
    
    // Check for company name in snippet
    if (lowerSnippet.includes(lowerCompany)) {
        score += 20;
    }
    
    // Check if title contains industry-relevant terms
    if (industry && INDUSTRY_KEYWORDS[industry.toLowerCase()]) {
        const industryTerms = INDUSTRY_KEYWORDS[industry.toLowerCase()];
        for (const term of industryTerms) {
            if (lowerTitle.includes(term)) {
                score += 5;
                break; // Only count industry relevance once
            }
        }
    }
    
    // Penalty for likely irrelevant content
    for (const term of IRRELEVANT_KEYWORDS) {
        if (lowerTitle.includes(term)) {
            score -= 30;
        }
    }
    
    // For financial news about banks, check for competing entity names
    if (industry && industry.toLowerCase().includes("financ")) {
        // List of major banks/financial institutions that might appear in news
        const competitors = ["jpmorgan", "bank of america", "wells fargo", "citibank", 
                             "morgan stanley", "goldman sachs"];
        
        // If article mentions competitor more prominently than target company
        for (const competitor of competitors) {
            if (competitor !== lowerCompany && 
                lowerTitle.includes(competitor) && 
                !lowerTitle.includes(lowerCompany)) {
                score -= 20; // Significant penalty for competitor-focused news
            }
        }
    }
    
    // Source credibility check for financial news
    if (industry && industry.toLowerCase().includes("financ")) {
        const credibleSources = ["bloomberg", "reuters", "wsj", "wall street journal", 
                               "financial times", "cnbc", "forbes"];
        for (const credSource of credibleSources) {
            if (lowerSource.includes(credSource)) {
                score += 5;
                break;
            }
        }
    }
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
}

/**
 * Fetch Google News data for a given company.
 * @param {string} companyName - The name of the company to search for.
 * @param {string} clientId - The ID of the client.
 * @param {string} userId - The ID of the user performing the search.
 * @returns {Promise<Array>} - Array of news articles.
 */
async function fetchGoogleNews(companyName, clientId, userId) {
    try {
        console.log(`🔍 Fetching Google News for: ${companyName} (Client ID: ${clientId}, User ID: ${userId})`);
        
        // Get industry context if possible
        let industry = "";
        try {
            // Try to fetch Apollo data first to get industry context
            const client = await getMongoClient();
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);
            
            const existingResearch = await collection.findOne(
                { clientId, userId, "data.apollo.companyInfo.industry": { $exists: true } }
            );
            
            if (existingResearch?.data?.apollo?.companyInfo?.industry) {
                industry = existingResearch.data.apollo.companyInfo.industry;
                console.log(`📊 Using industry context: ${industry}`);
            }
        } catch (err) {
            console.log("⚠️ Could not retrieve industry context, continuing without it.");
        }
        
        // Generate enhanced search query with better context
        const searchQuery = constructSearchQuery(companyName, industry);
        console.log(`🔍 Using enhanced search query: ${searchQuery}`);

        const response = await axios.get(GOOGLE_SEARCH_URL, {
            params: {
                engine: "google_news",
                q: searchQuery,
                api_key: GOOGLE_API_KEY,
                tbm: "nws",      // Ensure we're getting news results
                tbs: "qdr:m",    // Last month
                num: 10          // Get more results to filter down later
            },
        });

        if (!response.data.news_results || response.data.news_results.length === 0) {
            console.log("⚠️ No news results found.");
            return [];
        }

        // Process and score articles for relevance
        const scoredArticles = response.data.news_results.map(news => {
            // Extract and clean snippet if available
            let snippet = "No snippet available";
            if (news.snippet) {
                snippet = news.snippet;
            } else if (news.description) {
                snippet = news.description;
            }
            
            // Clean up date format
            let publishedDate = "Unknown";
            if (news.date) {
                try {
                    const date = new Date(news.date);
                    publishedDate = date.toISOString();
                } catch (e) {
                    publishedDate = news.date;
                }
            }
            
            const article = {
                title: news.title,
                url: news.link || "No URL available",
                snippet: snippet,
                publishedDate: publishedDate,
                source: news.source?.name || "Unknown Source",
                company: companyName,
                clientId: clientId,
                userId: userId
            };
            
            // Calculate relevance score
            const relevanceScore = scoreArticleRelevance(article, companyName, industry);
            return { ...article, relevanceScore };
        });
        
        // Filter by relevance and limit to top 5 articles
        const MIN_RELEVANCE_SCORE = 30; // Minimum relevance threshold
        const relevantArticles = scoredArticles
            .filter(article => article.relevanceScore >= MIN_RELEVANCE_SCORE)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5);
        
        // Remove the score property before returning
        const extractedNews = relevantArticles.map(article => {
            const { relevanceScore, ...rest } = article;
            return rest;
        });

        console.log(`✅ Retrieved ${extractedNews.length} relevant articles from Google News.`);
        
        // If we found no relevant articles, try a fallback search without filters
        if (extractedNews.length === 0 && scoredArticles.length > 0) {
            console.log(`⚠️ No relevant articles found with threshold. Using top 3 results instead.`);
            return scoredArticles
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, 3)
                .map(article => {
                    const { relevanceScore, ...rest } = article;
                    return rest;
                });
        }
        
        return extractedNews;
    } catch (error) {
        console.error("❌ Error fetching news:", error.response?.data || error.message);
        return [];
    }
}

/**
 * Store Google News research results in the MongoDB database.
 * Ensures `userId` is always stored and prevents redundant updates within the cooldown period.
 * @param {string} companyName - The name of the company.
 * @param {string} clientId - The ID of the client.
 * @param {string} userId - The ID of the user requesting the research.
 */
async function storeGoogleResearch(companyName, clientId, userId) {
    let client = null;
    
    try {
        client = await getMongoClient();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        console.log(`🔍 Checking if Google research exists for ${companyName} (Client ID: ${clientId})...`);
        const existingResearch = await collection.findOne({ clientId, userId });

        let lastUpdatedGoogle = existingResearch?.lastUpdatedGoogle || null;
        const now = new Date();

        // ✅ Prevent excessive API requests (cooldown logic)
        if (lastUpdatedGoogle && (now - new Date(lastUpdatedGoogle)) < COOLDOWN_PERIOD) {
            console.log(`⏳ Google research cooldown active for ${companyName}. Skipping Google fetch.`);
            return;
        }

        console.log(`🔄 Running Google research for ${companyName}...`);
        const googleData = await fetchGoogleNews(companyName, clientId, userId);

        if (googleData.length === 0) {
            console.log(`⚠️ No new Google data found for ${companyName}. Updating timestamp only.`);
            
            // Still update timestamp to respect cooldown period - using field-specific updates
            await collection.updateOne(
                { clientId, userId },
                {
                    $set: {
                        "lastUpdatedGoogle": now,
                        "lastUpdated.google": now // For backward compatibility
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
            
            return;
        }

        // MODIFIED: Use field-specific update for Google data instead of whole document
        await collection.updateOne(
            { clientId, userId },
            {
                $set: {
                    "data.google": googleData,  // Only update the google data field
                    "lastUpdatedGoogle": now,
                    "lastUpdated.google": now,
                    "companyName": companyName,
                    "company": companyName  // For backward compatibility
                },
                $setOnInsert: {
                    clientId,
                    userId
                }
            },
            { upsert: true }
        );

        console.log(`✅ Google research stored successfully for ${companyName}.`);
    } catch (error) {
        console.error(`❌ Error storing Google research for ${companyName}:`, error.message);
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
module.exports = storeGoogleResearch;