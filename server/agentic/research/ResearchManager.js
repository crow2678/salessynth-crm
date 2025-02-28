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

if (config.research_modules.apollo) {
    researchModules.apollo = require('./ApolloResearch');
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

        // Ensure research data is valid before sending
        if (!researchData || Object.keys(researchData).length === 0) {
            console.log("⚠️ No new research data available. Skipping GPT-4 call.");
            return "No new insights available at this time.";
        }

        // Build structured prompt with research insights & client-specific context
        const prompt = `
        You are a **sales intelligence assistant** helping a sales hunter close a deal with **${clientDetails.company}**.

        **🔹 Customer Details**
        - **Name:** ${clientDetails.name}
        - **Position:** ${clientDetails.position}
        - **Recent Notes:** ${clientDetails.notes || "No recent updates"}
        
        **📢 Latest Company News & Research**
        ${JSON.stringify(researchData, null, 2) || "No recent company updates available."}

        **📌 Active Deal Details**
        - **Deal:** ${clientDetails.deals?.[0]?.title || "No Active Deal"}
        - **Value:** $${clientDetails.deals?.[0]?.value || "N/A"}
        - **Status:** ${clientDetails.deals?.[0]?.status || "N/A"}

        ---
        🚀 **Generate 3 actionable sales insights** tailored for this deal:

        **1️⃣ Best Approach for the Next Sales Conversation**
        - Provide a **specific** engagement strategy considering the customer's role, company insights, and recent discussions.

        **2️⃣ Potential Objections & How to Overcome Them**
        - Identify likely objections **specific to this deal** and provide persuasive counterarguments.

        **3️⃣ Competitive Positioning & Strategic Opportunities**
        - Identify market trends, competitor gaps, or internal company shifts that give Tavant an advantage.

        **🎯 Format your response clearly using markdown styling for readability.**
        `;

        const response = await axios.post(OPENAI_API_URL, {
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 800,  // Increased token limit for detailed insights
            temperature: 0.7,  // Balanced creativity while keeping responses focused
        }, {
            headers: {
                "Content-Type": "application/json",
                "api-key": OPENAI_API_KEY
            }
        });

        const summary = response.data.choices[0].message.content;
        console.log("✅ GPT-4 Sales Intelligence Summary Generated with enhanced data");

        return summary;
    } catch (error) {
        console.error("❌ Error generating GPT-4 summary:", error.response?.data || error.message);
        return "Summary generation failed.";
    }
}

// Run research for a specific client and generate a summary
async function runResearchForClient(clientId, userId) {
    try {
        // ✅ Fetch `userId` and `companyName` upfront
        const clientData = await Client.findOne({ _id: clientId });
        if (!clientData) {
            console.log(`❌ No client data found for Client ID: ${clientId}. Skipping research.`);
            return;
        }

        if (!userId) {
            userId = clientData.userId;  // Use clientData.userId if userId not provided
        }
        
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

        // Find existing research document
        const existingResearch = await Research.findOne({ clientId, userId });
        
        // Run enabled research modules in parallel
        const moduleResults = [];
        await Promise.all(
            Object.keys(researchModules).map(async (module) => {
                console.log(`🔍 Executing ${module} research for ${companyName}...`);
                await researchModules[module](companyName, clientId, userId);
                moduleResults.push(module);
            })
        );

        console.log("✅ API Research Data Collected:\n", moduleResults.join(", "));

        // Fetch the updated research document after all modules have finished
        const updatedResearch = await Research.findOne({ clientId, userId });
        
        if (!updatedResearch) {
            console.log(`⚠️ Research document not found after updates for ${companyName}.`);
            runningResearch.delete(clientId);
            return;
        }

        console.log(`✅ Research completed for ${companyName}. Generating GPT-4 summary...`);

        // Generate AI-powered summary based on updated data
        const summary = await generateSummary(updatedResearch.data, clientData);

        // Update just the summary field without touching the data fields
        await Research.updateOne(
            { clientId, userId },
            { 
                $set: { 
                    summary: summary,
                    timestamp: new Date()
                }
            }
        );

        console.log(`✅ Research and summary stored for ${companyName} in CosmosDB.`);
        runningResearch.delete(clientId);
    } catch (error) {
        console.error("❌ Error in runResearchForClient:", error.message);
        runningResearch.delete(clientId);
    }
}

module.exports = { runResearchForClient };