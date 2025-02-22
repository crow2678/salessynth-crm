const { Research, Client } = require('../database/db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// Load config.json dynamically
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Dynamically load research modules based on config.json
const researchModules = {};

if (config.research_modules.google) {
    researchModules.google = require('./GoogleResearch');
}
if (config.research_modules.reddit) {
    researchModules.reddit = require('./RedditResearch');
}

// GPT-4 API details
const OPENAI_API_URL = "https://88f.openai.azure.com/openai/deployments/88FGPT4o/chat/completions?api-version=2024-02-15-preview";
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

// ✅ Prevent duplicate research runs
const runningResearch = new Set();

// Function to call GPT-4 and generate a structured sales summary
async function generateSummary(researchData, clientDetails) {
    try {
        console.log("🧠 Sending research data to GPT-4 for sales-focused summarization...");

        const prompt = `
        You are a sales intelligence assistant. The user is a sales hunter working to close a deal with ${clientDetails.company}.

        **Customer Details**
        - Name: ${clientDetails.name}
        - Position: ${clientDetails.position}
        - Notes: ${clientDetails.notes || "No recent updates"}

        **Latest Company News**
        ${JSON.stringify(researchData, null, 2) || "No recent news available"}

        **Active Deal**
        - ${clientDetails.deals?.[0]?.title || "No Active Deal"}
        - Value: $${clientDetails.deals?.[0]?.value || "N/A"}
        - Status: ${clientDetails.deals?.[0]?.status || "N/A"}

        **Generate 3 actionable sales insights:**
        1️⃣ **Best approach for the next sales conversation**  
           - Provide a strategy for engaging the customer based on their role, company news, and active deals.

        2️⃣ **Potential objections & strategies to overcome them**  
           - Identify likely objections the customer may have and provide ways to handle them effectively.

        3️⃣ **Competitive positioning & strategic opportunities**  
           - Identify market trends, competitors, or internal company shifts that the sales team can use to gain an advantage.
        `;

        const response = await axios.post(OPENAI_API_URL, {
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 500
        }, {
            headers: {
                "Content-Type": "application/json",
                "api-key": OPENAI_API_KEY
            }
        });

        const summary = response.data.choices[0].message.content;
        console.log("✅ GPT-4 Sales Intelligence Summary Generated:\n", summary);

        return summary;
    } catch (error) {
        console.error("❌ Error generating GPT-4 summary:", error.response?.data || error.message);
        return "Summary generation failed.";
    }
}

// Run research for a specific client and generate a summary
async function runResearchForClient(clientId) {
    try {
        // ✅ Fetch `userId` and `companyName` upfront
        const clientData = await Client.findOne({ _id: clientId });
        if (!clientData) {
            console.log(`❌ No client data found for Client ID: ${clientId}. Skipping research.`);
            return;
        }

        const userId = clientData.userId;
        const companyName = clientData.company;

        if (!userId || !clientId) {
            console.log(`❌ Missing userId or clientId. Skipping research for ${companyName}.`);
            return;
        }

        console.log(`🔍 Running research for: ${companyName} (Client ID: ${clientId}, User ID: ${userId})`);

        // ✅ Check if research is already in progress for this client
        if (runningResearch.has(clientId)) {
            console.log(`⚠️ Research already running for ${companyName}. Skipping duplicate run.`);
            return;
        }

        runningResearch.add(clientId);

        // Run enabled research modules in parallel and pass `clientId` and `userId`
        const researchResults = {};
        await Promise.all(
            Object.keys(researchModules).map(async (module) => {
                console.log(`🔍 Executing ${module} research for ${companyName}...`);
                researchResults[module] = await researchModules[module](companyName, clientId, userId);
            })
        );

        console.log("✅ API Research Data Collected:\n", JSON.stringify(researchResults, null, 2));

        console.log(`✅ Research completed for ${companyName}. Generating GPT-4 summary...`);

        // Generate AI-powered summary
        const summary = await generateSummary(researchResults, clientData);

        // ✅ Ensure `clientId` and `userId` are stored in research collection
        await Research.updateOne(
            { clientId, userId },
            { 
                $set: { 
                    clientId: clientId, 
                    userId: userId,     
                    company: companyName,
                    data: researchResults,
                    summary: summary,
                    timestamp: new Date()
                }
            },
            { upsert: true } 
        );

        console.log(`✅ Research and summary stored for ${companyName} in CosmosDB.`);

        runningResearch.delete(clientId);
    } catch (error) {
        console.error("❌ Error in runResearchForClient:", error.message);
        runningResearch.delete(clientId);
    }
}

module.exports = { runResearchForClient };
