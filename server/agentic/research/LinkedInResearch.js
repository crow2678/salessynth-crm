// src/agentic/research/LinkedInResearch.js
require("dotenv").config();
const axios = require("axios");
const { MongoClient } = require("mongodb");

// Constants
const LINKEDIN_API_URL = "https://api.linkedin.com/v2";
const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = "test";  // Match with your existing DB name
const COLLECTION_NAME = "research"; 
const COOLDOWN_PERIOD = 12 * 60 * 60 * 1000; // 12 hours - same as other modules

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
 * Get LinkedIn access token using client credentials grant flow
 * @returns {Promise<string>} Access token
 */
async function getLinkedInAccessToken() {
    try {
        const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
            params: {
                grant_type: 'client_credentials',
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting LinkedIn access token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with LinkedIn API');
    }
}

/**
 * Search for companies on LinkedIn
 * @param {string} companyName - The company name to search for
 * @param {string} accessToken - LinkedIn API access token
 * @returns {Promise<Object>} Company data
 */
async function searchCompany(companyName, accessToken) {
    try {
        // Search for the company by name
        const searchUrl = `${LINKEDIN_API_URL}/organizationSearch`;
        const searchResponse = await axios.get(searchUrl, {
            params: {
                q: 'universalName',
                universalName: companyName.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        if (!searchResponse.data.elements || searchResponse.data.elements.length === 0) {
            console.log(`No company found for ${companyName}`);
            return null;
        }

        // Return the first matching company
        return searchResponse.data.elements[0];
    } catch (error) {
        console.error('Error searching for company:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Get company details from LinkedIn
 * @param {string} companyId - LinkedIn company ID
 * @param {string} accessToken - LinkedIn API access token
 * @returns {Promise<Object>} Company details
 */
async function getCompanyDetails(companyId, accessToken) {
    try {
        // Get company details
        const companyUrl = `${LINKEDIN_API_URL}/organizations/${companyId}`;
        const companyResponse = await axios.get(companyUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        return companyResponse.data;
    } catch (error) {
        console.error('Error getting company details:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Get recent company posts from LinkedIn
 * @param {string} companyId - LinkedIn company ID
 * @param {string} accessToken - LinkedIn API access token
 * @returns {Promise<Array>} Company posts
 */
async function getCompanyPosts(companyId, accessToken) {
    try {
        // Get company posts (organization activity)
        const postsUrl = `${LINKEDIN_API_URL}/organizationalEntityActivities?q=organizationalEntity&organizationalEntity=urn:li:organization:${companyId}&count=10`;
        const postsResponse = await axios.get(postsUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        if (!postsResponse.data.elements || postsResponse.data.elements.length === 0) {
            console.log(`No posts found for company ID ${companyId}`);
            return [];
        }

        return postsResponse.data.elements;
    } catch (error) {
        console.error('Error getting company posts:', error.response?.data || error.message);
        return [];
    }
}

/**
 * Fetch LinkedIn data for a company
 * @param {string} companyName - The name of the company
 * @param {string} clientId - The ID of the client
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} Processed LinkedIn data
 */
async function fetchLinkedInData(companyName, clientId, userId) {
    try {
        console.log(`🔍 Fetching LinkedIn data for: ${companyName} (Client ID: ${clientId}, User ID: ${userId})`);
        
        // Get LinkedIn access token
        const accessToken = await getLinkedInAccessToken();
        
        // Search for the company
        const companySearchResult = await searchCompany(companyName, accessToken);
        if (!companySearchResult) {
            console.log(`⚠️ No LinkedIn company found for ${companyName}`);
            return null;
        }
        
        const companyId = companySearchResult.id;
        
        // Get company details
        const companyDetails = await getCompanyDetails(companyId, accessToken);
        if (!companyDetails) {
            console.log(`⚠️ Couldn't get LinkedIn details for company ${companyId}`);
            return null;
        }
        
        // Get recent company posts
        const companyPosts = await getCompanyPosts(companyId, accessToken);
        
        // Process and return the data
        const linkedInData = {
            companyInfo: {
                name: companyDetails.name,
                description: companyDetails.description?.text || '',
                industry: companyDetails.industry || '',
                website: companyDetails.websiteUrl || '',
                companySize: companyDetails.staffCount || 'Unknown',
                headquarters: companyDetails.headquarter?.city 
                    ? `${companyDetails.headquarter.city}, ${companyDetails.headquarter.country}` 
                    : 'Unknown',
                founded: companyDetails.foundedOn?.year || 'Unknown',
                specialties: companyDetails.specialties || [],
                followerCount: companyDetails.followingInfo?.followerCount || 0
            },
            recentUpdates: companyPosts.map(post => {
                return {
                    date: post.published?.time ? new Date(post.published.time).toISOString() : 'Unknown',
                    message: post.message?.text || 'No message text',
                    engagement: {
                        likes: post.totalShareStatistics?.likeCount || 0,
                        comments: post.totalShareStatistics?.commentCount || 0,
                        shares: post.totalShareStatistics?.shareCount || 0
                    }
                };
            })
        };
        
        console.log(`✅ Successfully fetched LinkedIn data for ${companyName}`);
        return linkedInData;
    } catch (error) {
        console.error(`❌ Error fetching LinkedIn data for ${companyName}:`, error.message);
        return null;
    }
}

/**
 * Store LinkedIn research results in the MongoDB database
 * @param {string} companyName - The name of the company
 * @param {string} clientId - The ID of the client
 * @param {string} userId - The ID of the user
 */
async function storeLinkedInResearch(companyName, clientId, userId) {
    let client = null;
    
    try {
        client = await getMongoClient();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        console.log(`🔍 Checking if LinkedIn research exists for ${companyName} (Client ID: ${clientId})...`);
        const existingResearch = await collection.findOne({ clientId, userId });

        let lastUpdatedLinkedIn = existingResearch?.lastUpdatedLinkedIn || null;
        const now = new Date();

        // Prevent excessive API requests (cooldown logic)
        if (lastUpdatedLinkedIn && (now - new Date(lastUpdatedLinkedIn)) < COOLDOWN_PERIOD) {
            console.log(`⏳ LinkedIn research cooldown active for ${companyName}. Skipping LinkedIn fetch.`);
            return;
        }

        console.log(`🔄 Running LinkedIn research for ${companyName}...`);
        const linkedInData = await fetchLinkedInData(companyName, clientId, userId);

        if (!linkedInData) {
            console.log(`⚠️ No LinkedIn data found for ${companyName}. Updating timestamp only.`);
            
            // Update timestamp to respect cooldown period
            await collection.updateOne(
                { clientId, userId },
                {
                    $set: {
                        "lastUpdatedLinkedIn": now,
                        "lastUpdated.linkedin": now // For consistency with other modules
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

        // Store the LinkedIn data
        await collection.updateOne(
            { clientId, userId },
            {
                $set: {
                    "data.linkedin": linkedInData,
                    "lastUpdatedLinkedIn": now,
                    "lastUpdated.linkedin": now
                },
                $setOnInsert: {
                    clientId,
                    userId,
                    companyName
                }
            },
            { upsert: true }
        );

        console.log(`✅ LinkedIn research stored successfully for ${companyName}.`);
    } catch (error) {
        console.error(`❌ Error storing LinkedIn research for ${companyName}:`, error.message);
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
module.exports = storeLinkedInResearch;