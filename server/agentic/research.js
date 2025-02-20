const axios = require("axios");

const SERPAPI_KEY = process.env.SERPAPI_KEY; // Get from SerpAPI
const SERPAPI_URL = "https://serpapi.com/search.json";

async function fetchCompanyNews(companyName) {
    try {
        const response = await axios.get(SERPAPI_URL, {
            params: {
                engine: "google",
                q: `${companyName} latest news`,
                api_key: SERPAPI_KEY
            }
        });

        return response.data.organic_results?.map(item => ({
            title: item.title,
            url: item.link,
            snippet: item.snippet
        })) || [];
    } catch (error) {
        console.error("SerpAPI Error:", error.message);
        return [];
    }
}

module.exports = { fetchCompanyNews };
