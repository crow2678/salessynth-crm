const mongoose = require("mongoose");

const ResearchSchema = new mongoose.Schema({
    clientId: { type: String, required: true },
    userId: { type: String, required: true },
    company: { type: String, required: true },
    data: { type: Object, required: true },
    summary: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
});

const Research = mongoose.model("Research", ResearchSchema);
module.exports = Research;
