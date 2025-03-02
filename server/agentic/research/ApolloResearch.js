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

// Common name parts to help with matching (e.g., JPMorgan Chase -> "JPMorgan")
const COMPANY_NAME_PARTS = {
    "JPMorgan Chase": ["JPMorgan", "Chase"],
    "Bank of America": ["Bank of America", "BofA"],
    "Wells Fargo": ["Wells", "Fargo"],
    "Morgan Stanley": ["Morgan Stanley"],
    "Goldman Sachs": ["Goldman", "Sachs"],
    "Citigroup": ["Citi", "Citigroup", "Citibank"],
    "Microsoft": ["Microsoft", "MSFT"],
    "Alphabet": ["Google", "Alphabet"],
    "Amazon": ["Amazon", "AWS"],
    "Apple": ["Apple"]
    // Add more common company names as needed
};

// Industry-specific executive titles to target
const EXECUTIVE_TITLES = {
    // Generic high-level executives
    "generic": ["CEO", "Chief Executive Officer", "COO", "President", "CFO", "CTO", "CIO"],
    
    // Financial industry executives
    "financial services": [
        "Chief Investment Officer", "Chief Risk Officer", "Head of Investment Banking",
        "Head of Trading", "Managing Director", "Chief Lending Officer", "SVP Banking"
    ],
    
    // Technology industry executives
    "technology": [
        "Chief Product Officer", "VP Engineering", "CTO", "Chief Technology Officer",
        "Head of Innovation", "VP Product", "Chief Digital Officer", "Chief AI Officer"
    ],
    
    // Healthcare industry executives
    "healthcare": [
        "Chief Medical Officer", "Medical Director", "VP Clinical Operations",
        "Chief Research Officer", "Director of Patient Care", "Chief Science Officer"
    ]
};

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
 * Enhance and normalize company names for better matching
 * @param {string} companyName - Raw company name
 * @returns {string[]} - Array of possible name variations to check
 */
function generateCompanyNameVariations(companyName) {
    if (!companyName) return [];
    
    const variations = [companyName];
    const lowerName = companyName.toLowerCase();
    
    // Remove common suffixes for better matching
    const suffixes = [" Inc", " Corp", " LLC", " Ltd", " Limited", " Co"];
    for (const suffix of suffixes) {
        if (companyName.endsWith(suffix)) {
            variations.push(companyName.substring(0, companyName.length - suffix.length));
            break;
        }
    }
    
    // Add variations without spaces (e.g. "JP Morgan" -> "JPMorgan")
    if (companyName.includes(" ")) {
        const noSpaces = companyName.replace(/\s+/g, "");
        variations.push(noSpaces);
    }
    
    // Check if it's a well-known company with aliases
    for (const [knownName, aliases] of Object.entries(COMPANY_NAME_PARTS)) {
        if (lowerName.includes(knownName.toLowerCase())) {
            variations.push(...aliases);
        } else {
            // Check if any alias is in the company name
            for (const alias of aliases) {
                if (lowerName.includes(alias.toLowerCase())) {
                    variations.push(knownName);
                    variations.push(...aliases);
                    break;
                }
            }
        }
    }
    
    // Handle banking specific cases
    if (lowerName.includes("bank")) {
        // Add variant without "bank" for better matching
        const withoutBank = companyName.replace(/\sbank(\sof\s|\s)/i, " ");
        if (withoutBank !== companyName) {
            variations.push(withoutBank);
        }
    }
    
    // Remove duplicates and return
    return [...new Set(variations)];
}

/**
 * Score a potential company match from search results
 * @param {Object} company - Company data from search results
 * @param {string} targetName - Target company name
 * @returns {number} - Score 0-100 indicating match quality
 */
function scoreCompanyMatch(company, targetName) {
    let score = 0;
    const targetLower = targetName.toLowerCase();
    const variations = generateCompanyNameVariations(targetName);
    
    // Exact name match is highest priority
    if (company.name.toLowerCase() === targetLower) {
        score += 50;
    } 
    // Check for name variations
    else {
        let bestVariationMatch = 0;
        for (const variation of variations) {
            if (company.name.toLowerCase() === variation.toLowerCase()) {
                bestVariationMatch = 40;
                break;
            } else if (company.name.toLowerCase().includes(variation.toLowerCase())) {
                bestVariationMatch = Math.max(bestVariationMatch, 30);
            } else if (variation.toLowerCase().includes(company.name.toLowerCase())) {
                bestVariationMatch = Math.max(bestVariationMatch, 25);
            }
        }
        score += bestVariationMatch;
    }
    
    // Website domain match is strong signal
    const targetDomain = targetLower.replace(/[^a-z0-9]/g, "");
    if (company.website_domain && company.website_domain.includes(targetDomain)) {
        score += 30;
    }
    
    // Specific industry information increases confidence
    if (company.industry) {
        score += 10;
    }
    
    // More data fields available indicates higher quality match
    if (company.phone_number) score += 5;
    if (company.linkedin_url) score += 5;
    if (company.twitter_url) score += 5;
    if (company.short_description) score += 5;
    
    // If employees count data is available, more likely to be a legitimate company
    if (company.estimated_num_employees) score += 5;
    
    return Math.min(100, score);
}

/**
 * Find best executive for a company based on industry
 * @param {Object} organization - Company data
 * @param {string} industry - Industry from Apollo
 * @returns {Promise<Array>} - Array of executive data objects
 */
async function findCompanyExecutives(organization, industry) {
    if (!organization || !organization.id) {
        return [];
    }
    
    try {
        console.log(`🔍 Searching for executives at ${organization.name}...`);
        
        // UPDATED: Try using people/match endpoint with modified approach
        const matchResponse = await axios({
            method: 'POST',
            url: `${APOLLO_API_URL}/people/match`, // No parameters in body; use URL params instead
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APOLLO_API_KEY,
                'Cache-Control': 'no-cache',
                'accept': 'application/json'  // Add this header
            },
            params: {  // Use URL params instead of request body
                organization_name: organization.name,
                reveal_personal_emails: false,
                reveal_phone_number: false
            }
        });
        
        // Rest of your code to process the results...
        
        if (matchResponse.data?.person) {
            const person = matchResponse.data.person;
            // Only add if we have valid name data
            if (person.first_name && person.last_name && 
                person.first_name !== "null" && person.last_name !== "null") {
                return [{
                    name: `${person.first_name} ${person.last_name}`,
                    title: person.title || "Executive",
                    email: person.email || null,
                    phone: person.phone_number || null,
                    linkedin: person.linkedin_url || null
                }];
            }
        }
        
        return []; // Return empty array if no executives found
    } catch (error) {
        console.error("❌ Error finding executives:", error.message);
        // Continue without executive data
        return [];
    }
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
        
        // Generate name variations for better matching
        const companyVariations = generateCompanyNameVariations(companyName);
        console.log(`🔍 Searching for organization with variations: ${companyVariations.join(", ")}`);

        // 1. Search for organization details
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
                per_page: 10  // Get more results to find the best match
            }
        });

        // Check if we found any organization
        if (!searchResponse.data?.organizations || searchResponse.data.organizations.length === 0) {
            console.log(`⚠️ No organization found for ${companyName} on Apollo.io`);
            return null;
        }

        // Find the best match from search results using our scoring function
        const scoredMatches = searchResponse.data.organizations.map(org => ({
            organization: org,
            score: scoreCompanyMatch(org, companyName)
        })).sort((a, b) => b.score - a.score);
        
        console.log(`✅ Found ${scoredMatches.length} potential matches. Best match: ${scoredMatches[0].organization.name} (score: ${scoredMatches[0].score})`);
        
        // Threshold for reliable match
        if (scoredMatches[0].score < 40) {
            console.log(`⚠️ Best match score (${scoredMatches[0].score}) is below threshold. Proceed with caution.`);
        }
        
        const bestMatch = scoredMatches[0].organization;
        
        // Extract company data from search result
        const companyData = bestMatch;
        const industry = companyData.industry || "";
        
        // 2. Find executives for the company
        const keyPeople = await findCompanyExecutives(bestMatch, industry);
        
        // Normalize industry data
        let normalizedIndustry = industry.toLowerCase();
        // Map specific industries to general categories
        if (normalizedIndustry.includes('bank') || 
            normalizedIndustry.includes('financ') ||
            normalizedIndustry.includes('invest') ||
            normalizedIndustry.includes('insur')) {
            normalizedIndustry = 'financial services';
        } else if (normalizedIndustry.includes('tech') ||
                  normalizedIndustry.includes('software') ||
                  normalizedIndustry.includes('computer') ||
                  normalizedIndustry.includes('it ')) {
            normalizedIndustry = 'technology';  
        } else if (normalizedIndustry.includes('health') ||
                  normalizedIndustry.includes('medical') ||
                  normalizedIndustry.includes('pharma') ||
                  normalizedIndustry.includes('biotech')) {
            normalizedIndustry = 'healthcare';
        }

        // Structure the enriched data
        const enrichedData = {
            companyInfo: {
                name: companyData.name,
                domain: companyData.website_domain,
                website: companyData.website_url,
                description: companyData.short_description,
                industry: normalizedIndustry || industry || "Unknown",
                sizeRange: companyData.employee_count_by_range || "Unknown",
                estimatedEmployees: companyData.estimated_num_employees || "Unknown",
                yearFounded: companyData.founded_year || "Unknown",
                annualRevenue: companyData.annual_revenue_formatted || "Unknown",
                stockSymbol: companyData.ticker || null,
                publiclyTraded: companyData.ticker ? true : false,
                headquarters: {
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
                technologies: companyData.technologies || [],
                competitors: companyData.competitors || []
            },
            keyPeople: keyPeople,
            funding: {
                totalRaised: companyData.total_funding_formatted || "Unknown",
                lastFundingDate: companyData.latest_funding_round_date || null,
                lastFundingAmount: companyData.latest_funding_round_amount_formatted || "Unknown",
                lastFundingType: companyData.latest_funding_stage || "Unknown",
                ventureFunded: companyData.total_funding ? true : false
            },
            matchQuality: {
                score: scoredMatches[0].score,
                nameMatchType: scoredMatches[0].score >= 80 ? "exact" : scoredMatches[0].score >= 60 ? "strong" : "partial",
                confidence: scoredMatches[0].score >= 80 ? "high" : scoredMatches[0].score >= 60 ? "medium" : "low"
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