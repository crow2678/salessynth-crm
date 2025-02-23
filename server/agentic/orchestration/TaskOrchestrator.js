const { Research, Client } = require('../database/db'); 
const { runResearchForClient } = require('../research/ResearchManager'); 
require("dotenv").config();

const COOLDOWN_PERIOD = 12 * 60 * 60 * 1000; // 12 hours

async function orchestrateResearch() {
    try {
        console.log("🚀 TaskOrchestrator: Fetching active clients...");

        const clients = await Client.find({ isActive: true });

        if (clients.length === 0) {
            console.log("⚠️ No active clients found. Research skipped.");
            return;
        }

        console.log(`🔄 Found ${clients.length} active clients. Checking for updates...`);

        for (const client of clients) {
            const clientId = client._id.toString();
            const userId = client.userId;
            const companyName = client.company;

            console.log(`🔍 Checking research status for: ${companyName} (Client ID: ${clientId})`);

            const lastResearch = await Research.findOne({ clientId, userId });

            const now = new Date();

            // ✅ Separate last research timestamps for Google & Reddit
            const lastGoogleResearch = lastResearch?.lastUpdatedGoogle ? lastResearch.lastUpdatedGoogle : null;
            const lastRedditResearch = lastResearch?.lastUpdatedReddit ? lastResearch.lastUpdatedReddit : null;

            const googleCooldownActive = lastGoogleResearch && (now - new Date(lastGoogleResearch)) < COOLDOWN_PERIOD;
            const redditCooldownActive = lastRedditResearch && (now - new Date(lastRedditResearch)) < COOLDOWN_PERIOD;

            if (googleCooldownActive) {
                console.log(`⏳ Google research cooldown active for ${companyName}. Skipping Google.`);
            }

            if (redditCooldownActive) {
                console.log(`⏳ Reddit research cooldown active for ${companyName}. Skipping Reddit.`);
            }

            if (!googleCooldownActive || !redditCooldownActive) {
                console.log(`🔄 Running research for ${companyName}...`);
                await runResearchForClient(clientId, userId, companyName);
            } else {
                console.log(`✅ Cooldown active for all research types. Skipping ${companyName}.`);
            }
        }

        console.log("✅ Research refresh cycle completed.");
    } catch (error) {
        console.error("❌ TaskOrchestrator Error:", error.message);
    }
}

module.exports = { orchestrateResearch };
