require("dotenv").config();
const express = require("express");
const { orchestrateResearch } = require("./orchestration/TaskOrchestrator");
const researchRoutes = require("./routes/researchRoutes");
require("./database/db"); // ✅ This now correctly manages MongoDB connection

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/research", researchRoutes);

console.log("🔄 Starting orchestrateResearch()...");

// ✅ Run Google & Reddit research on startup (if enabled in config.json)
orchestrateResearch()
    .then(() => console.log("🎯 Research orchestration completed."))
    .catch(err => console.error("❌ Error in orchestrateResearch:", err));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
