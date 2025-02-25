require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = "test"; // Ensure this matches your CosmosDB database name

mongoose.connect(`${MONGODB_URI}/${DATABASE_NAME}`, {});

// ✅ Research Schema (Now includes `userId`, `clientId`, and `summary`)
// In db.js
const researchSchema = new mongoose.Schema({
    clientId: { type: String, required: true },
    userId: { type: String, required: true },
    company: { type: String, required: true },
    data: {
        google: { type: Array, default: null },
        reddit: { type: Array, default: null },
        // Future API integrations can be added here:
        // linkedin: { type: Array, default: null },
        // twitter: { type: Array, default: null },
        // crunchbase: { type: Array, default: null },
        // etc.
    },
    summary: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    // Track when each data source was last updated
    lastUpdated: {
        google: { type: Date, default: null },
        reddit: { type: Date, default: null },
        // Match the structure of your data field for future APIs
    }
}, { collection: "research" });

// Add this to make the schema more flexible
researchSchema.set('strict', false);
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

//const Client = mongoose.model("Client", clientSchema);
const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);


const db = mongoose.connection;

db.on("connected", () => console.log("✅ Connected to CosmosDB (MongoDB API)"));
db.on("error", (err) => console.error("❌ CosmosDB Connection Error:", err));
db.on("disconnected", () => console.log("⚠️ Disconnected from CosmosDB"));

module.exports = { db, Research, Client };
