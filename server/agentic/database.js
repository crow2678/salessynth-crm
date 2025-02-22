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

// Define Mongoose Schema for Research
const researchSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    clientId: { type: String, required: true },
    company: { type: String, required: true },
    generatedAt: { type: Date, required: true },
    insights: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
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
    const testModeHours = 1; // Change this to control testing time
    const twelveHoursAgo = new Date(Date.now() - testModeHours * 60 * 60 * 1000);
    console.log('Looking for clients not researched since:', twelveHoursAgo);

    try {
        console.log(`🔍 Fetching clients for follow-up who have NOT been researched in the last ${testModeHours} hours...`);

        // Get all clients due for follow-up
        const clients = await Client.find({
            isActive: true,
            followUpDate: { $lte: new Date() }
        }).exec();

        if (!clients.length) {
            console.warn("⚠️ No clients found for follow-up.");
            return [];
        }

        console.log(`📊 Found ${clients.length} active clients to check...`);

        // Filter out clients whose research was done within the last period
        const filteredClients = [];
        for (const client of clients) {
            const lastResearch = await Research.findOne({ 
                clientId: client._id.toString() 
            }).sort({ createdAt: -1 });

            if (!lastResearch || new Date(lastResearch.createdAt) < twelveHoursAgo) {
                filteredClients.push({
                    clientId: client._id.toString(),
                    userId: client.userId,
                    company: client.company,
                    name: client.name,
                    notes: client.notes,
                    deals: client.deals,
                });
                console.log(`✅ Adding ${client.company} for research`);
            } else {
                console.log(`⏳ Skipping ${client.company}: Last research was ${new Date(lastResearch.createdAt)}`);
            }
        }

        console.log(`📝 Final client count for research: ${filteredClients.length}`);
        return filteredClients;
    } catch (error) {
        console.error("❌ Error fetching clients for follow-up:", error.message);
        return [];
    }
}

// Save research insights using Mongoose
async function saveSalesInsights(userId, clientId, insights) {
    try {
        await connectDB();
        console.log(`💾 Starting to save insights...`);
        console.log(`User: ${userId}, Client: ${clientId}`);
        
        // Validate inputs
        if (!userId || !clientId || !insights || !insights.insights) {
            throw new Error('Missing required parameters for saving insights');
        }

        // Create new research document using Mongoose model
        const newResearch = new Research({
            userId,
            clientId,
            company: insights.company,
            generatedAt: insights.generatedAt,
            insights: insights.insights
        });

        // Save the document
        const savedResearch = await newResearch.save();

        console.log(`✅ Successfully stored insights for ${insights.company}`);
        return savedResearch;
    } catch (error) {
        console.error('❌ Error in saveSalesInsights:', error.message);
        console.error('Error details:', error);
        throw error;
    }
}

// Close database connection function
async function closeConnection() {
    try {
        await mongoose.connection.close();
        console.log('📡 Closed database connection');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
}

// Export functions
module.exports = { 
    connectDB,
    fetchClientsForFollowUp, 
    saveSalesInsights,
    closeConnection
};