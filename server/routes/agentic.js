const express = require("express");
const { runAgenticResearch } = require("../agentic/index");

const router = express.Router();

router.post("/trigger-research", async (req, res) => {
    try {
        await runAgenticResearch();
        res.status(200).json({ message: "Agentic research triggered successfully!" });
    } catch (error) {
        console.error("❌ Error triggering research:", error.message);
        res.status(500).json({ message: "Failed to start research." });
    }
});

module.exports = router;
