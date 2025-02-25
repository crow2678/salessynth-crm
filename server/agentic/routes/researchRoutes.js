const express = require("express");
const { Research } = require("../database/db");
const router = express.Router();

// ✅ API Endpoint: Get Research Summary for a Client & User
router.get("/summary/:clientId/:userId", async (req, res) => {
    try {
        const { clientId, userId } = req.params;

        console.log(`🔍 Fetching research summary for Client ID: ${clientId}, User ID: ${userId}`);

        // ✅ Fetch research entry from CosmosDB
        const research = await Research.findOne({ clientId, userId });

        if (!research) {
            return res.status(404).json({ message: "No research found for this client and user." });
        }

        // ✅ Extract last updated timestamp if available
        const lastUpdated = research.timestamp
            ? new Date(research.timestamp).toISOString()
            : null;

        res.json({
            summary: research.summary || "No AI summary available.",
            data: research.data || {},
            company: research.company || "Unknown Company",
            timestamp: lastUpdated
        });

    } catch (error) {
        console.error("❌ Error fetching research summary:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ API Endpoint: Get Google Research Data
router.get("/research/google/:clientId", async (req, res) => {
    try {
        const { clientId } = req.params;

        console.log(`🔍 Fetching Google research for Client ID: ${clientId}`);

        const googleDoc = await Research.findOne(
            { clientId, "data.google": { $exists: true, $ne: null } },
            { "data.google": 1, timestamp: 1, company: 1 } // Return only required fields
        );

        if (!googleDoc) {
            return res.status(404).json({ message: "Google data not found" });
        }

        res.json({
            googleData: googleDoc.data.google,
            lastUpdated: googleDoc.timestamp ? new Date(googleDoc.timestamp).toISOString() : null,
            company: googleDoc.company || "Unknown Company"
        });

    } catch (error) {
        console.error("❌ Error fetching Google research:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ API Endpoint: Get Reddit Research Data
router.get("/research/reddit/:clientId", async (req, res) => {
    try {
        const { clientId } = req.params;

        console.log(`🔍 Fetching Reddit research for Client ID: ${clientId}`);

        const redditDoc = await Research.findOne(
            { clientId, "data.reddit": { $exists: true, $ne: null } },
            { "data.reddit": 1, timestamp: 1, company: 1 }
        );

        if (!redditDoc) {
            return res.status(404).json({ message: "Reddit data not found" });
        }

        res.json({
            redditData: redditDoc.data.reddit,
            lastUpdated: redditDoc.timestamp ? new Date(redditDoc.timestamp).toISOString() : null,
            company: redditDoc.company || "Unknown Company"
        });

    } catch (error) {
        console.error("❌ Error fetching Reddit research:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
