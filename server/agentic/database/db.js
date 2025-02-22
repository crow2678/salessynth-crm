require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = "test"; // Ensure this matches your CosmosDB database name

mongoose.connect(`${MONGODB_URI}/${DATABASE_NAME}`, {});

// ✅ Research Schema (Now includes `userId`, `clientId`, and `summary`)
const researchSchema = new mongoose.Schema({
    clientId: { type: String, required: true }, // Unique client reference
    userId: { type: String, required: true },   // Unique user reference
    company: { type: String, required: true },  // Company name
    source: { type: String, required: true },   // Source of research (Google, Reddit, etc.)
    data: { type: Object, required: true },     // Raw research data
    summary: { type: String, default: "" },     // Final AI-generated summary
    timestamp: { type: Date, default: Date.now }
});
const Research = mongoose.model("Research", researchSchema);

// ✅ Client Schema (matches your `clients` collection structure)
const clientSchema = new mongoose.Schema({
    name: String,
    email: String,
    company: String,
    position: String,
    notes: String,
    isActive: Boolean,
    deals: Array,
    followUpDate: Date,
    lastContact: Date,
    userId: String
}, { collection: "clients" }); // Ensure it targets the `clients` collection

const Client = mongoose.model("Client", clientSchema);

const db = mongoose.connection;

db.on("connected", () => console.log("✅ Connected to CosmosDB (MongoDB API)"));
db.on("error", (err) => console.error("❌ CosmosDB Connection Error:", err));
db.on("disconnected", () => console.log("⚠️ Disconnected from CosmosDB"));

module.exports = { db, Research, Client };
