// updateFlightTracking.js
require('dotenv').config();
const mongoose = require('mongoose');

// Get the connection string from environment variables
const connectionString = process.env.MONGODB_URI || 
                        process.env.CUSTOMCONNSTR_MONGODB_URI || 
                        process.env.MONGODBCONNSTR_MONGODB_URI;

// Cosmos DB connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: false,
    ssl: true,
    maxPoolSize: 5,
    minPoolSize: 1
};

// User schema (matching your existing schema)
const userSchema = new mongoose.Schema({
    email: String,
    flightTrackingEnabled: Boolean,
    flightTrackingQuota: Number,
    premiumFeatures: Map
});

const User = mongoose.model('User', userSchema);

// Update function
async function updateUser(userEmail) {
    try {
        // Connect to database
        console.log('Connecting to database...');
        await mongoose.connect(connectionString, options);
        console.log('Connected to database');

        // Update user
        const result = await User.findOneAndUpdate(
            { email: userEmail },
            { 
                $set: {
                    flightTrackingEnabled: true,
                    flightTrackingQuota: 5,
                    'premiumFeatures.flightTracking': true
                }
            },
            { new: true }
        );

        if (result) {
            console.log('\nUser updated successfully:');
            console.log(`Email: ${result.email}`);
            console.log(`Flight Tracking: Enabled`);
            console.log(`Quota: 5 flights`);
        } else {
            console.log(`\nUser ${userEmail} not found`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        // Close connection
        await mongoose.disconnect();
        console.log('\nDisconnected from database');
    }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
    console.error('Please provide an email address.');
    console.log('Usage: node updateFlightTracking.js user@example.com');
    process.exit(1);
}

// Run the update
updateUser(userEmail);