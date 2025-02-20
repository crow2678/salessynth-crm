require("dotenv").config();
const axios = require("axios");

// Ensure API key and endpoint are loaded
if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    console.error("❌ ERROR: Azure OpenAI credentials are missing! Check your .env file.");
    process.exit(1);
}

const OPENAI_API_URL = `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`;

/**
 * Generate AI-powered sales insights using Azure OpenAI.
 */
async function generateSalesInsights(customer, newsArticles) {
    const newsText = newsArticles.map(n => `${n.title}: ${n.snippet}`).join("\n");

    const prompt = `
    You are a sales intelligence assistant. The user is a sales hunter working to close a deal with ${customer.company}.
    
    **Customer Details**
    - Name: ${customer.name}
    - Position: ${customer.position}
    - Notes: ${customer.notes}

    **Latest Company News**
    ${newsText}

    **Active Deal**
    - ${customer.deals?.[0]?.title || "No Active Deal"}
    - Value: $${customer.deals?.[0]?.value || "N/A"}
    - Status: ${customer.deals?.[0]?.status || "N/A"}

    **Generate 3 insights:**
    1. Best approach for the next sales conversation.
    2. Key objections & strategies to overcome them.
    3. Competitive positioning & strategic opportunities.
    `;

    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4",
                temperature: 0.7,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "api-key": process.env.AZURE_OPENAI_API_KEY,
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("❌ Azure OpenAI API Error:", error.response?.data || error.message);
        return "Error generating insights.";
    }
}

module.exports = { generateSalesInsights };
