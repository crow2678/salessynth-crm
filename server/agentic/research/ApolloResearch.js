// src/agentic/research/ApolloResearch.js
require("dotenv").config();
const axios = require("axios");
const { MongoClient } = require("mongodb");

// Constants
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_API_URL = "https://api.apollo.io/api/v1";
const MONGO_URI = process.env.MONGODB_URI;
const COOLDOWN_PERIOD = 12 * 60 * 60 * 1000; // 12 hours - same as other modules
const DB_NAME = "test";  // Match with existing DB name
const COLLECTION_NAME = "research";

// Create a connection pool instead of new connections for each call
let mongoClient = null;
async function getMongoClient() {
    if (!mongoClient) {
        mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
    }
    return mongoClient;
}

/**
 * Search for company information using Apollo.io
 * @param {string} companyName - The name of the company to research
 * @param {string} clientId - The ID of the client
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - Enriched company data
 */
async function enrichCompanyData(companyName, clientId, userId) {
    try {
        console.log(`🔍 Enriching company data for: ${companyName} (Client ID: ${clientId}, User ID: ${userId})`);

        // Input validation
        if (!companyName || companyName.trim() === '') {
            console.log('⚠️ Empty company name provided. Skipping Apollo enrichment.');
            return null;
        }

        // 1. Search for organization details
        console.log(`🔍 Searching for organization: ${companyName}`);
        const searchResponse = await axios({
            method: 'POST',
            url: `${APOLLO_API_URL}/organizations/search`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APOLLO_API_KEY,
                'Cache-Control': 'no-cache'
            },
            data: {
                q_organization_name: companyName,
                page: 1,
                per_page: 5
            }
        });

        // Check if we found any organization
        if (!searchResponse.data?.organizations || searchResponse.data.organizations.length === 0) {
            console.log(`⚠️ No organization found for ${companyName} on Apollo.io`);
            return null;
        }

        // Find the best match from search results
        let bestMatch = null;
        const exactNameMatch = searchResponse.data.organizations.find(
            org => org.name.toLowerCase() === companyName.toLowerCase()
        );
        
        if (exactNameMatch) {
            bestMatch = exactNameMatch;
        } else {
            // Use first result as fallback
            bestMatch = searchResponse.data.organizations[0];
        }

        console.log(`✅ Found organization: ${bestMatch.name}`);
        
        // Extract company data from search result
        const companyData = bestMatch;
        
        // 2. Try to find a key executive using people/match
        // We'll search for a CEO or high-level executive based on common patterns
        let keyPeople = [];
        try {
            // Attempt to find the CEO using people/match
            console.log(`🔍 Attempting to find CEO or key executive at ${bestMatch.name}`);
            
            // Create a fake CEO name based on company name for matching
            // This is just to provide organization_name to get potential matches
            const matchResponse = await axios({
                method: 'POST',
                url: `${APOLLO_API_URL}/people/match`,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': APOLLO_API_KEY,
                    'Cache-Control': 'no-cache'
                },
                data: {
                    organization_name: bestMatch.name,
                    reveal_personal_emails: false,
                    reveal_phone_number: false
                }
            });
            
            // If we get person data back, add it to key people
            if (matchResponse.data?.person) {
                const person = matchResponse.data.person;
                // Only add if we have valid name data
                if (person.first_name && person.last_name && 
                    person.first_name !== "null" && person.last_name !== "null") {
                    keyPeople.push({
                        name: `${person.first_name} ${person.last_name}`,
                        title: person.title || "Executive",
                        email: person.email || null,
                        phone: person.phone_number || null,
                        linkedin: person.linkedin_url || null
                    });
                    console.log(`✅ Found key executive: ${person.first_name} ${person.last_name}`);
                }
            } else {
                console.log(`⚠️ No key executives found for ${bestMatch.name}`);
            }
        } catch (error) {
            console.error("❌ Error fetching key people:", 
                error.response?.data || error.message);
            // Continue with the company data even if fetching people fails
        }

        // Structure the enriched data
        const enrichedData = {
            companyInfo: {
                name: companyData.name,
                domain: companyData.website_domain,
                website: companyData.website_url,
                description: companyData.short_description,
                industry: companyData.industry,
                sizeRange: companyData.employee_count_by_range || "Unknown",
                estimatedEmployees: companyData.estimated_num_employees || "Unknown",
                yearFounded: companyData.founded_year || "Unknown",
                annualRevenue: companyData.annual_revenue_formatted || "Unknown",
                location: {
                    city: companyData.city || "Unknown",
                    state: companyData.state || "Unknown",
                    country: companyData.country || "Unknown"
                },
                socialProfiles: {
                    linkedin: companyData.linkedin_url || null,
                    twitter: companyData.twitter_url || null,
                    facebook: companyData.facebook_url || null
                },
                phoneNumber: companyData.phone_number || "Unknown",
                technologies: companyData.technologies || []
            },
            keyPeople: keyPeople,
            funding: {
                totalRaised: companyData.total_funding_formatted || "Unknown",
                lastFundingDate: companyData.latest_funding_round_date || null,
                lastFundingAmount: companyData.latest_funding_round_amount_formatted || "Unknown",
                lastFundingType: companyData.latest_funding_stage || "Unknown"
            }
        };

        console.log(`✅ Successfully enriched data for ${companyName} via Apollo`);
        return enrichedData;
    } catch (error) {
        // Enhanced error logging
        if (error.response) {
            console.error(`❌ Apollo API Error (${error.response.status}):`, 
                error.response.data?.message || JSON.stringify(error.response.data));
            
            // Log validation errors specifically
            if (error.response.status === 422 && error.response.data?.errors) {
                console.error('Validation errors:', error.response.data.errors);
            }
        } else if (error.request) {
            console.error('❌ No response received from Apollo API:', error.message);
        } else {
            console.error('❌ Error setting up Apollo request:', error.message);
        }
        return null;
    }
}

/**
 * Store Apollo enrichment results in the MongoDB database
 * @param {string} companyName - The name of the company
 * @param {string} clientId - The ID of the client
 * @param {string} userId - The ID of the user
 */
async function storeApolloResearch(companyName, clientId, userId) {
    let client = null;
    
    try {
        client = await getMongoClient();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        console.log(`🔍 Checking if Apollo research exists for ${companyName} (Client ID: ${clientId})...`);
        const existingResearch = await collection.findOne({ clientId, userId });

        let lastUpdatedApollo = existingResearch?.lastUpdatedApollo || null;
        const now = new Date();

        // Prevent excessive API requests (cooldown logic)
        if (lastUpdatedApollo && (now - new Date(lastUpdatedApollo)) < COOLDOWN_PERIOD) {
            console.log(`⏳ Apollo research cooldown active for ${companyName}. Skipping Apollo fetch.`);
            return;
        }

        console.log(`🔄 Running Apollo enrichment for ${companyName}...`);
        const apolloData = await enrichCompanyData(companyName, clientId, userId);

        // Changed: Use field-specific update instead of whole document replacement
        if (!apolloData) {
            console.log(`⚠️ No Apollo data found for ${companyName}. Updating timestamp only.`);
            
            // Update timestamp to respect cooldown period - using field-specific updates
            await collection.updateOne(
                { clientId, userId },
                {
                    $set: {
                        "lastUpdatedApollo": now,
                        "lastUpdated.apollo": now // For consistency with other modules
                    },
                    $setOnInsert: {
                        clientId,
                        userId,
                        companyName
                    }
                },
                { upsert: true }
            );
            
            return;
        }

        // Store the Apollo data with field-specific updates
        await collection.updateOne(
            { clientId, userId },
            {
                $set: {
                    "data.apollo": apolloData,  // Only update the apollo data field
                    "lastUpdatedApollo": now,
                    "lastUpdated.apollo": now,
                    "companyName": companyName,  // Ensure these fields are set
                    "company": companyName       // For backward compatibility
                },
                $setOnInsert: {
                    clientId,
                    userId
                }
            },
            { upsert: true }
        );

        console.log(`✅ Apollo research stored successfully for ${companyName}.`);
    } catch (error) {
        console.error(`❌ Error storing Apollo research for ${companyName}:`, error.message);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection due to application termination');
    if (mongoClient) {
        await mongoClient.close();
    }
    process.exit(0);
});

// Export the main function
module.exports = storeApolloResearch;