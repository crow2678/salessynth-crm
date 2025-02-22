const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_URL = "https://serpapi.com/search.json";

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
            userId: userId
        }));

        console.log(`✅ Retrieved ${extractedNews.length} articles from Google News.`);
        return extractedNews;
    } catch (error) {
        console.error("❌ Error fetching news:", error.response?.data || error.message);
        return [];
    }
}

module.exports = fetchGoogleNews;
