const { Research, Client } = require('../database/db'); 
const { runResearchForClient } = require('../research/ResearchManager'); 
require("dotenv").config();

const COOLDOWN_PERIOD = 12 * 60 * 60 * 1000; 

async function orchestrateResearch() {
    try {
        console.log("🚀 TaskOrchestrator: Fetching active clients...");

        const clients = await Client.find({ isActive: true });

        if (clients.length === 0) {
            console.log("⚠️ No active clients found. Research skipped.");
            return;
        }

        console.log(`🔄 Found ${clients.length} active clients. Checking for updates...`);

        const researchTasks = clients.map(async (client) => {
            const clientId = client._id.toString();
            const userId = client.userId;
            const companyName = client.company;

            console.log(`🔍 Checking if ${companyName} needs research updates...`);

			const lastResearch = await Research.findOne({ clientId, userId }).sort({ createdAt: -1 });

			//const lastResearch = await Research.findOne({ clientId, userId }).sort({ _ts: -1 });

            const lastResearchUpdated = lastResearch ? lastResearch.createdAt : null;
            const clientUpdatedAt = client.updatedAt;
            const now = new Date();
            const cooldownActive = lastResearchUpdated && (now - lastResearchUpdated) < COOLDOWN_PERIOD;

            const followUpDue = client.followUpDate && client.followUpDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const lastResearchOld = !lastResearchUpdated || (now - lastResearchUpdated) >= 14 * 24 * 60 * 60 * 1000;
            const dealInProposal = client.deals && client.deals.some(deal => deal.status === "proposal");
            const meaningfulNoteUpdate = client.notes && client.notes.includes("contract") || client.notes.includes("pricing");

            if ((followUpDue || lastResearchOld || dealInProposal || meaningfulNoteUpdate) && !cooldownActive) {
                console.log(`🔄 Changes detected for ${companyName}. Running fresh research...`);
                await runResearchForClient(clientId, userId, companyName);
            } else {
                console.log(`✅ No updates or cooldown active for ${companyName}. Skipping research.`);
            }
        });

        await Promise.all(researchTasks);

        console.log("✅ Research refresh cycle completed.");
    } catch (error) {
        console.error("❌ TaskOrchestrator Error:", error.message);
    }
}

module.exports = { orchestrateResearch };
