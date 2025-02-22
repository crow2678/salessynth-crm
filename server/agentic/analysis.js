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
    console.log('\n=== 🤖 Starting GPT Analysis ===');
    console.log(`📊 Company: ${customer.company}`);
    console.log(`📑 Processing ${newsArticles.length} articles`);
    console.log('================================\n');

    const newsText = newsArticles.map(n => {
        const date = new Date(n.publishedDate).toLocaleDateString();
        return `[${date}] ${n.title}
Source: ${n.source}
Summary: ${n.snippet || 'No summary available'}
${n.diffbotAnalysis ? '✅ Enriched with Diffbot' : '⚠️ Basic article data only'}\n`;
    }).join("\n");

    console.log('📝 Prepared News Summary:');
    console.log('------------------------');
    console.log(newsText);
    console.log('------------------------\n');

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

    console.log('🚀 Sending request to Azure OpenAI...');

    try {
        console.log(`⏳ Awaiting GPT analysis for ${customer.company}...`);

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

        console.log('\n=== ✅ GPT Analysis Complete ===');
        console.log(`📊 Response tokens: ${response.data.usage?.total_tokens || 'N/A'}`);
        console.log(`⏱️ Time: ${new Date().toISOString()}`);
        console.log('=============================\n');

        console.log('📋 Generated Insights:');
        console.log('-------------------');
        console.log(response.data.choices[0].message.content);
        console.log('-------------------\n');

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('\n❌ Azure OpenAI API Error:');
        console.error('------------------------');
        if (error.response?.data) {
            console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
        console.error('------------------------\n');
        throw new Error(`Failed to generate insights: ${error.message}`);
    }
}

module.exports = { generateSalesInsights };