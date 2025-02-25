const axios = require("axios");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_URL = "https://serpapi.com/search.json";
const MONGO_URI = process.env.MONGODB_URI;
const COOLDOWN_PERIOD = 12 * 60 * 60 * 1000; // 12 hours

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

        const response = await axios.get(GOOGLE_SEARCH_URL, {
            params: {
                engine: "google_news",
                q: `${companyName} latest news`,
                api_key: GOOGLE_API_KEY,
            },
        });

        if (!response.data.news_results || response.data.news_results.length === 0) {
            console.log("⚠️ No news results found.");
            return [];
        }

        let extractedNews = response.data.news_results.slice(0, 5).map(news => ({
            title: news.title,
            url: news.link || "No URL available",
            snippet: news.snippet || "No snippet available",
            publishedDate: news.date || "Unknown",
            source: news.source?.name || "Unknown Source",
            company: companyName,
            clientId: clientId,
            userId: userId  // ✅ Ensure userId is included in every stored item
        }));

        console.log(`✅ Retrieved ${extractedNews.length} articles from Google News.`);
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
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        const db = client.db("test");
        const collection = db.collection("research");

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
            console.log(`⚠️ No new Google data found for ${companyName}. Skipping storage.`);
            return;
        }

        // ✅ Ensure `userId` is stored in the research collection
        await collection.updateOne(
            { clientId, userId },  // ✅ Match on both `clientId` and `userId` to avoid duplication
            {
                $set: {
                    clientId: clientId,
                    userId: userId,  // ✅ Ensure userId is explicitly stored
                    "data.google": googleData,
                    "lastUpdatedGoogle": now,  // ✅ Store Google-specific timestamp
                },
            },
            { upsert: true }
        );

        console.log(`✅ Google research stored successfully for ${companyName}.`);
    } catch (error) {
        console.error(`❌ Error storing Google research for ${companyName}:`, error.message);
    } finally {
        await client.close();
    }
}

module.exports = storeGoogleResearch;
