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
 * Extracts and normalizes domain from various inputs
 * @param {string} input - Company name, URL, or email address
 * @returns {string|null} - Extracted domain or null
 */
function extractDomain(input) {
    if (!input) return null;
    
    // Try to extract from URL
    if (input.includes("http") && input.includes("://")) {
        try {
            const url = new URL(input);
            return url.hostname.toLowerCase().replace(/^www\./, "");
        } catch (e) {
            // Not a valid URL
        }
    }
    
    // Try to extract from email
    if (input.includes("@") && !input.includes(" ")) {
        const parts = input.split("@");
        if (parts.length === 2 && parts[1].includes(".")) {
            return parts[1].toLowerCase();
        }
    }
    
    // Return null if no domain found
    return null;
}

/**
 * Simple normalization of company names - remove common suffixes and legal forms
 * @param {string} name - Company name
 * @returns {string} - Normalized name
 */
function normalizeCompanyName(name) {
    if (!name) return "";
    
    // Convert to lowercase
    let normalized = name.toLowerCase();
    
    // Remove common suffixes
    const suffixes = [
        ' inc', ' inc.', ' incorporated', 
        ' corp', ' corp.', ' corporation',
        ' llc', ' ltd', ' limited', 
        ' gmbh', ' co', ' co.', ' company'
    ];
    
    for (const suffix of suffixes) {
        if (normalized.endsWith(suffix)) {
            normalized = normalized.slice(0, -suffix.length);
            break;
        }
    }
    
    // Remove special characters and extra spaces
    normalized = normalized.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    return normalized;
}

/**
 * Extract key growth indicators from company data
 * @param {Object} companyData - Organization data
 * @returns {Object} - Growth indicators with explanation
 */
function extractGrowthIndicators(companyData) {
    const indicators = [];
    
    // Check employee count
    if (companyData.estimated_num_employees) {
        const employees = companyData.estimated_num_employees;
        
        if (employees >= 10000) {
            indicators.push(`Enterprise organization (${employees.toLocaleString()} employees)`);
        } else if (employees >= 1000) {
            indicators.push(`Large organization (${employees.toLocaleString()} employees)`);
        } else if (employees >= 200) {
            indicators.push(`Mid-market organization (${employees.toLocaleString()} employees)`);
        } else if (employees >= 50) {
            indicators.push(`SMB organization (${employees.toLocaleString()} employees)`);
        } else {
            indicators.push(`Small organization (${employees.toLocaleString()} employees)`);
        }
    }
    
    // Check annual revenue
    if (companyData.annual_revenue_printed) {
        indicators.push(`Annual revenue: ${companyData.annual_revenue_printed}`);
    }
    
    // Check for funding
    if (companyData.total_funding) {
        indicators.push(`Total funding: ${companyData.total_funding_printed}`);
        
        // Check recent funding
        if (companyData.funding_events && companyData.funding_events.length > 0) {
            const latestFunding = companyData.funding_events[0];
            if (latestFunding.date) {
                const fundingDate = new Date(latestFunding.date);
                const monthsAgo = Math.floor((new Date() - fundingDate) / (30 * 24 * 60 * 60 * 1000));
                
                if (monthsAgo <= 12) {
                    indicators.push(
                        `Recent ${latestFunding.type} funding: ${latestFunding.currency}${latestFunding.amount} (${monthsAgo} months ago)`
                    );
                }
            }
        }
    }
    
    // Check technology adoption
    if (companyData.technology_names && companyData.technology_names.length > 0) {
        const techCount = companyData.technology_names.length;
        if (techCount > 20) {
            indicators.push(`Technology-driven organization (${techCount} technologies in use)`);
        }
    }
    
    return {
        indicators,
        hasGrowthSignals: indicators.length > 0
    };
}

/**
 * Analyze technology stack for buying signals
 * @param {Array} technologies - Technology data from Apollo
 * @returns {Object} - Analysis results
 */
function analyzeTechnologyStack(technologies) {
    if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
        return { 
            categories: [],
            buyingSignals: []
        };
    }
    
    // Extract categories from technology data
    const categories = {};
    const buyingSignals = [];
    
    // Process each technology
    technologies.forEach(tech => {
        if (tech.category) {
            if (!categories[tech.category]) {
                categories[tech.category] = [];
            }
            categories[tech.category].push(tech.name);
        }
    });
    
    // Convert to array format
    const categoriesArray = Object.entries(categories).map(([category, techs]) => ({
        category,
        technologies: techs
    }));
    
    // Look for specific buying signals
    const techNames = technologies.map(t => t.name.toLowerCase());
    
    // CRM signals
    if (techNames.includes('salesforce') || techNames.includes('hubspot')) {
        buyingSignals.push('Using CRM platform');
    }
    
    // Marketing automation signals
    if (techNames.includes('marketo') || techNames.includes('hubspot') || 
        techNames.includes('mailchimp') || techNames.includes('pardot')) {
        buyingSignals.push('Using marketing automation');
    }
    
    // Analytics signals
    if (techNames.includes('google analytics') || techNames.includes('mixpanel') || 
        techNames.includes('amplitude')) {
        buyingSignals.push('Using analytics tools');
    }
    
    // Cloud services signals
    const cloudTechs = ['aws', 'amazon web services', 'microsoft azure', 'google cloud', 'heroku'];
    if (cloudTechs.some(tech => techNames.includes(tech))) {
        buyingSignals.push('Using cloud infrastructure');
    }
    
    return {
        categories: categoriesArray,
        buyingSignals
    };
}

/**
 * Search for company using domain or name
 * @param {string} query - Company domain or name
 * @returns {Promise<Object>} - Best match company data
 */
async function findCompany(query) {
    // First check if query is a domain
    const isDomain = query.includes('.') && !query.includes(' ');
    
    try {
        if (isDomain) {
            // Try organization enrichment first (most accurate)
            try {
                const response = await axios({
                    method: 'POST',
                    url: `${APOLLO_API_URL}/organizations/enrich`,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': APOLLO_API_KEY
                    },
                    data: {
                        domain: query
                    }
                });
                
                if (response.data?.organization) {
                    console.log(`✅ Found organization via domain enrichment: ${response.data.organization.name}`);
                    return response.data.organization;
                }
            } catch (error) {
                console.log(`⚠️ Domain enrichment failed for ${query}: ${error.message}`);
                // Continue to search as fallback
            }
        }
        
        // Fallback to accounts/search
        console.log(`🔍 Searching for organization: ${query}`);
        const searchResponse = await axios({
            method: 'POST',
            url: `${APOLLO_API_URL}/accounts/search`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APOLLO_API_KEY
            },
            data: {
                q_organization_name: query,
                page: 1,
                per_page: 5
            }
        });
        
        if (!searchResponse.data?.accounts || searchResponse.data.accounts.length === 0) {
            console.log(`⚠️ No organizations found for ${query}`);
            return null;
        }
        
        // For simplicity, take the first result
        // In a more advanced implementation, you could score and rank them
        console.log(`✅ Found organization via search: ${searchResponse.data.accounts[0].name}`);
        return searchResponse.data.accounts[0];
    } catch (error) {
        console.error(`❌ Error finding company: ${error.message}`);
        return null;
    }
}

/**
 * Find key decision makers at a company
 * @param {string} domain - Company domain
 * @param {string} companyName - Company name as fallback
 * @returns {Promise<Array>} - Array of key people
 */
async function findKeyPeople(domain, companyName) {
    try {
        console.log(`🔍 Finding key people at ${domain || companyName}`);
        
        // Prepare search query
        const searchData = domain 
            ? { q: { organization_domains: [domain] } }
            : { q: { organization_name: companyName } };
            
        // Add filters for senior positions
        searchData.q.seniority = ["director_level", "vp_level", "executive_level", "c_suite_level", "owner"];
        
        // Execute search
        const response = await axios({
            method: 'POST',
            url: `${APOLLO_API_URL}/people/search`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APOLLO_API_KEY
            },
            data: {
                ...searchData,
                page: 1,
                per_page: 10
            }
        });
        
        if (!response.data?.people || response.data.people.length === 0) {
            console.log(`⚠️ No key people found for ${domain || companyName}`);
            return [];
        }
        
        // Format the people data
        const people = response.data.people.map(person => ({
            name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
            title: person.title || "Unknown",
            email: person.email || null,
            emailStatus: person.email_status || null,
            phone: person.phone_number || null,
            linkedinUrl: person.linkedin_url || null,
            seniority: person.seniority || null,
            departments: person.departments || [],
            photoUrl: person.photo_url || null
        }));
        
        console.log(`✅ Found ${people.length} key people at ${domain || companyName}`);
        return people;
    } catch (error) {
        console.error(`❌ Error finding key people: ${error.message}`);
        return [];
    }
}

/**
 * Enrich company data using Apollo's API
 * @param {string} companyName - The name of the company to research
 * @param {string} clientId - The ID of the client
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - Enriched company data
 */
async function enrichCompanyData(companyName, clientId, userId) {
    try {
        console.log(`🔍 Enriching company data for: ${companyName}`);
        
        if (!companyName) {
            console.log('⚠️ Empty company name provided');
            return null;
        }
        
        // Try to extract domain if company name looks like domain/email/URL
        let domain = extractDomain(companyName);
        let searchQuery = companyName;
        
        // If we have a domain, use it as primary identifier
        if (domain) {
            console.log(`📌 Extracted domain: ${domain} from input`);
            searchQuery = domain;
        }
        
        // Find company data
        const companyData = await findCompany(searchQuery);
        if (!companyData) {
            return null;
        }
        
        // Get the company domain from results if not already known
        domain = domain || companyData.website_domain || extractDomain(companyData.website_url);
        
        // Find key people at the company
        const keyPeople = await findKeyPeople(domain, companyData.name);
        
        // Extract growth indicators
        const growthData = extractGrowthIndicators(companyData);
        
        // Analyze technology stack
        const techAnalysis = analyzeTechnologyStack(companyData.current_technologies);
        
        // Structure the enriched data
        const enrichedData = {
            company: {
                name: companyData.name,
                domain: domain || companyData.website_domain,
                website: companyData.website_url,
                description: companyData.short_description,
                industry: companyData.industry || "Unknown",
                size: companyData.estimated_num_employees || "Unknown",
                revenue: companyData.annual_revenue_printed || "Unknown",
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
                parent: companyData.owned_by_organization ? {
                    name: companyData.owned_by_organization.name,
                    domain: extractDomain(companyData.owned_by_organization.website_url)
                } : null
            },
            keyPeople: keyPeople,
            funding: {
                totalRaised: companyData.total_funding_printed || "Unknown",
                lastFunding: companyData.funding_events && companyData.funding_events.length > 0 ? {
                    date: companyData.funding_events[0].date,
                    amount: `${companyData.funding_events[0].currency || '$'}${companyData.funding_events[0].amount}`,
                    type: companyData.funding_events[0].type
                } : null
            },
            technologies: {
                count: companyData.technology_names ? companyData.technology_names.length : 0,
                names: companyData.technology_names || [],
                categories: techAnalysis.categories || []
            },
            insights: {
                growthIndicators: growthData.indicators || [],
                buyingSignals: techAnalysis.buyingSignals || [],
                keywords: companyData.keywords || []
            }
        };
        
        console.log(`✅ Successfully enriched data for ${companyName}`);
        return enrichedData;
    } catch (error) {
        console.error(`❌ Error in Apollo enrichment: ${error.message}`);
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