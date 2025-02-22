require("dotenv").config();
const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_URL = "https://serpapi.com/search.json";

const DIFFBOT_API_KEY = process.env.DIFFBOT_API_KEY;
const DIFFBOT_API_URL = "https://api.diffbot.com/v3/analyze";

// Validate API keys at startup
if (!DIFFBOT_API_KEY || !GOOGLE_API_KEY) {
    console.error("❌ ERROR: API keys missing in environment variables!");
    process.exit(1);
}

async function fetchCompanyNews(companyName) {
    try {
        if (!companyName || typeof companyName !== 'string') {
            console.error("❌ Invalid company name provided");
            return [];
        }

        const response = await axios.get(GOOGLE_SEARCH_URL, {
            params: {
                engine: "google_news",
                q: `${companyName} latest news`,
                api_key: GOOGLE_API_KEY,
            },
        });

        if (!response.data.news_results || response.data.news_results.length === 0) {
            return [];
        }

        let extractedNews = response.data.news_results.map(news => ({
            title: news.title,
            url: cleanURL(news.link),
            snippet: news.snippet || "No snippet available",
            publishedDate: news.date || "Unknown",
            source: news.source?.name || "Unknown Source",
        }));

        extractedNews = extractedNews.filter(
            (article, index, self) =>
                index === self.findIndex((n) => n.title === article.title)
        );

        return extractedNews;
    } catch (error) {
        console.error("❌ Error fetching news:", error.response?.data || error.message);
        return [];
    }
}

function cleanURL(url) {
    try {
        const parsedUrl = new URL(url);
        parsedUrl.search = "";
        return parsedUrl.toString();
    } catch (error) {
        return url;
    }
}

async function fetchDiffbotCompanyInsights(newsArticles) {
    if (!Array.isArray(newsArticles)) {
        console.error("❌ ERROR: Invalid input. Expected array of news articles");
        return [];
    }

    if (newsArticles.length === 0) {
        return [];
    }

    try {
        const diffbotResults = await Promise.all(
            newsArticles.map(async (article) => {
                if (!article.url) {
                    return article;
                }

                try {
                    const response = await axios.get(DIFFBOT_API_URL, {
                        params: {
                            token: DIFFBOT_API_KEY,
                            url: article.url,
                        },
                        timeout: 30000,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'YourApp/1.0'
                        }
                    });

                    if (response.data.error) {
                        return {
                            ...article,
                            diffbotAnalysis: null,
                            diffbotError: response.data.error
                        };
                    }

                    return {
                        ...article,
                        diffbotAnalysis: response.data
                    };

                } catch (error) {
                    return {
                        ...article,
                        diffbotAnalysis: null,
                        diffbotError: error.response?.data?.error || error.message
                    };
                }
            })
        );

        const validResults = diffbotResults.filter(result => result !== null);
        return validResults;

    } catch (error) {
        console.error("❌ Error in Diffbot processing:", error.message);
        return newsArticles;
    }
}

async function researchCompany(companyName, userId) {
    console.log(`🔍 Starting research for ${companyName} (User: ${userId})`);

    try {
        const googleNews = await fetchCompanyNews(companyName);
        
        if (!googleNews.length) {
            return [];
        }

        const enrichedArticles = await fetchDiffbotCompanyInsights(googleNews);
        return enrichedArticles;
    } catch (error) {
        console.error(`❌ Error researching ${companyName}:`, error);
        return [];
    }
}

module.exports = {
    researchCompany
};