require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = "test"; // Match your database name in CosmosDB
const CLIENTS_COLLECTION = "clients";
const RESEARCH_COLLECTION = "research";

// Define Mongoose Schema for Clients
const clientSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: String,
    company: String,
    name: String,
    notes: String,
    deals: Array,
    followUpDate: Date,
    isActive: Boolean,
});

// Define Mongoose Schema for Research (New Collection)
const researchSchema = new mongoose.Schema({
    userId: String, // Link to SalesSynth user
    clientId: String, // Link to client
    insights: String, // AI-generated insights
    companyNews: Array, // Web research results
    createdAt: { type: Date, default: Date.now },
});

// Create Mongoose Models
const Client = mongoose.model("Client", clientSchema, CLIENTS_COLLECTION);
const Research = mongoose.model("Research", researchSchema, RESEARCH_COLLECTION);

// Connect to CosmosDB (MongoDB API)
async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        console.log("✅ Already connected to CosmosDB.");
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: DATABASE_NAME,
        });
        console.log("✅ Connected to CosmosDB (MongoDB API) using Mongoose.");
    } catch (error) {
        console.error("❌ Error connecting to CosmosDB:", error.message);
        process.exit(1);
    }
}

// Fetch clients due for follow-up
async function fetchClientsForFollowUp() {
    await connectDB();
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago

    try {
        console.log(`🔍 Fetching clients for follow-up who have NOT been researched in the last 12 hours...`);

        // Get all clients due for follow-up
        const clients = await Client.find({
            isActive: true,
            followUpDate: { $lte: new Date() }, // Follow-up due today or earlier
        }).exec();

        if (!clients.length) {
            console.warn("⚠️ No clients found for follow-up.");
            return [];
        }

        // Filter out clients whose research was done within the last 12 hours
        const filteredClients = [];
        for (const client of clients) {
            const lastResearch = await Research.findOne({ clientId: client._id }).sort({ createdAt: -1 });

            if (!lastResearch || new Date(lastResearch.createdAt) < twelveHoursAgo) {
                filteredClients.push({
                    clientId: client._id.toString(),
                    userId: client.userId,
                    company: client.company,
                    name: client.name,
                    notes: client.notes,
                    deals: client.deals,
                });
            } else {
                console.log(`⏳ Skipping ${client.company}: Last research was within the last 12 hours.`);
            }
        }

        return filteredClients;
    } catch (error) {
        console.error("❌ Error fetching clients for follow-up:", error.message);
        return [];
    }
}


// Save research insights
async function saveSalesInsights(userId, clientId, insights, companyNews) {
    await connectDB();

    try {
        console.log(`💾 Attempting to store insights for User: ${userId}, Client: ${clientId}`);

        // Remove duplicate company news based on title
        const uniqueNews = companyNews.filter(
            (news, index, self) =>
                index === self.findIndex((n) => n.title === news.title)
        );

        // Remove duplicate insights (if any exist in similar format)
        const existingRecord = await Research.findOne({ userId, clientId });

        if (existingRecord) {
            console.log("🔍 Existing insights found, updating instead of inserting...");
            existingRecord.insights = insights;
            existingRecord.companyNews = uniqueNews;
            existingRecord.createdAt = new Date();
            await existingRecord.save();
            console.log(`✅ Updated insights for User: ${userId}, Client: ${clientId}`);
        } else {
            // Insert new record if none exists
            const document = {
                userId,
                clientId,
                insights,
                companyNews: uniqueNews,
                createdAt: new Date().toISOString(),
            };
            await Research.create(document);
            console.log(`✅ New insights stored for User: ${userId}, Client: ${clientId}`);
        }
    } catch (error) {
        console.error("❌ Error saving sales insights:", error.message);
    }
}


// Ensure functions are correctly exported
module.exports = { fetchClientsForFollowUp, saveSalesInsights };
