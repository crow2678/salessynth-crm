const express = require("express");
const { Research } = require("../database/db");
const router = express.Router();

// API Endpoint: Get Research Summary for a Client & User
router.get("/summary/:clientId/:userId", async (req, res) => {
    try {
        const { clientId, userId } = req.params;

        console.log(`🔍 Fetching research summary for Client ID: ${clientId}, User ID: ${userId}`);

        // Fetch research entry from CosmosDB
        const research = await Research.findOne({ clientId, userId });

        if (!research) {
            return res.status(404).json({ message: "No research found for this client and user." });
        }

        res.json({ summary: research.summary, data: research.data });
    } catch (error) {
        console.error("❌ Error fetching research summary:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
