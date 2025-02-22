const express = require("express");
const { orchestrateResearch } = require("./orchestration/TaskOrchestrator");
const researchRoutes = require("./routes/researchRoutes");
require("./database/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/research", researchRoutes);

// 🔹 Run research tasks on startup (can be disabled if needed)
orchestrateResearch();

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
