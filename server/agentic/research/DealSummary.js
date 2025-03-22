// /agentic/research/DealSummary.js
const axios = require('axios');
const { Research, Client } = require('../database/db');
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// Load config dynamically
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Constants
const OPENAI_API_URL = "https://88f.openai.azure.com/openai/deployments/88FGPT4o/chat/completions?api-version=2024-02-15-preview";
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const COOLDOWN_PERIOD = (config.cache_settings?.cooldown_period_hours || 12) * 60 * 60 * 1000;
const ACTIVE_DEAL_STATUSES = ['prospecting', 'qualified', 'proposal', 'negotiation'];

// Prevent duplicate processing
const runningProcesses = new Set();

/**
 * Generate intelligence for a client's active deals
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @return {Promise<boolean>} - Success status
 */
async function generateDealIntelligence(clientId, userId) {
  if (!clientId || !userId) {
    console.log("❌ Missing clientId or userId for deal intelligence generation");
    return false;
  }

  // Check if already running
  const processKey = `${clientId}-${userId}`;
  if (runningProcesses.has(processKey)) {
    console.log(`⚠️ Deal intelligence already running for client ${clientId}. Skipping duplicate run.`);
    return false;
  }

  runningProcesses.add(processKey);

  try {
    console.log(`🔍 Generating deal intelligence for client ID: ${clientId}, user ID: ${userId}`);
    
    // Fetch client data
    const client = await Client.findOne({ _id: clientId, userId });
    if (!client) {
      console.log(`❌ No client found with ID: ${clientId}`);
      return false;
    }

    // Check if client has deals
    if (!client.deals || client.deals.length === 0) {
      console.log(`ℹ️ Client ${client.name || client.company || clientId} has no deals. Storing message.`);
      // Store message about no deals in research collection
      await storeNoDealsMessage(clientId, userId, client.company || client.name || "Unknown");
      return true;
    }

    // Filter only active deals
    const activeDeals = client.deals.filter(deal => ACTIVE_DEAL_STATUSES.includes(deal.status));
    
    if (activeDeals.length === 0) {
      console.log(`ℹ️ Client ${client.name || client.company || clientId} has no active deals. Storing message.`);
      // Store message about no active deals in research collection
      await storeClosedDealsMessage(clientId, userId, client.company || client.name || "Unknown");
      return true;
    }

    // Get existing research to check cooldown
    const existingResearch = await Research.findOne({ clientId, userId });
    
    // Check if we need to refresh (honor cooldown period)
    const now = new Date();
    if (existingResearch && existingResearch.data && existingResearch.data.dealIntelligence) {
      const lastUpdateTime = existingResearch.lastUpdated?.dealIntelligence 
        ? new Date(existingResearch.lastUpdated.dealIntelligence) 
        : null;
      
      if (lastUpdateTime && (now - lastUpdateTime) < COOLDOWN_PERIOD) {
        console.log(`⏳ Deal intelligence cooldown active for client ${clientId}. Skipping generation.`);
        return true;
      }
    }

    // Get most advanced deal (primary deal)
    const primaryDeal = getHighestPriorityDeal(activeDeals);
    
    // Fetch research data for context
    let googleData = [];
    let pdlData = null;
    
    if (existingResearch && existingResearch.data) {
      if (existingResearch.data.google && Array.isArray(existingResearch.data.google)) {
        googleData = existingResearch.data.google;
      }
      
      if (existingResearch.data.pdl) {
        pdlData = existingResearch.data.pdl;
      }
    }

    // Generate deal intelligence using GPT
    const dealIntelligence = await callGPTForDealIntelligence(client, primaryDeal, googleData, pdlData);
    
    // Store in research collection
    const updateResult = await storeDealIntelligence(clientId, userId, client.company || client.name || "Unknown", dealIntelligence);
    
    console.log(`✅ Deal intelligence generated and stored for client ${clientId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error generating deal intelligence for client ${clientId}:`, error.message);
    return false;
  } finally {
    runningProcesses.delete(processKey);
  }
}

/**
 * Process deal intelligence for all clients with active deals
 * @return {Promise<void>}
 */
async function processAllClientDeals() {
  try {
    console.log("🚀 Starting deal intelligence processing for all clients with active deals...");
    
    // Query clients with active deals
    const clientsWithDeals = await Client.find({
      deals: { $exists: true, $ne: [] },
      isActive: true
    });
    
    if (clientsWithDeals.length === 0) {
      console.log("⚠️ No clients with deals found.");
      return;
    }
    
    console.log(`🔄 Found ${clientsWithDeals.length} clients with deals. Processing deal intelligence...`);
    
    // Process clients in batches to avoid overloading
    const batchSize = 5;
    for (let i = 0; i < clientsWithDeals.length; i += batchSize) {
      const batch = clientsWithDeals.slice(i, i + batchSize);
      
      // Process in parallel
      await Promise.all(
        batch.map(client => generateDealIntelligence(client._id.toString(), client.userId))
      );
      
      // Add a small delay between batches
      if (i + batchSize < clientsWithDeals.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log("✅ Deal intelligence processing completed successfully.");
  } catch (error) {
    console.error("❌ Error in processAllClientDeals:", error.message);
  }
}

/**
 * Get the highest priority deal based on stage
 * @param {Array} deals - List of deals
 * @return {Object} - Highest priority deal
 */
function getHighestPriorityDeal(deals) {
  // Deal stage priorities (higher number = higher priority)
  const stagePriorities = {
    'negotiation': 4,
    'proposal': 3,
    'qualified': 2,
    'prospecting': 1
  };
  
  return deals.reduce((highest, current) => {
    const currentPriority = stagePriorities[current.status] || 0;
    const highestPriority = highest ? stagePriorities[highest.status] || 0 : 0;
    
    if (currentPriority > highestPriority) {
      return current;
    } else if (currentPriority === highestPriority) {
      // If same stage, prioritize by value
      return (current.value || 0) > (highest.value || 0) ? current : highest;
    }
    
    return highest;
  }, null);
}

/**
 * Call GPT to generate deal intelligence
 * @param {Object} client - Client data
 * @param {Object} deal - Deal data
 * @param {Array} googleData - Google research data
 * @param {Object} pdlData - PDL company data
 * @return {Promise<Object>} - Deal intelligence data
 */
async function callGPTForDealIntelligence(client, deal, googleData = [], pdlData = null) {
  try {
    console.log("🧠 Generating GPT-based deal intelligence...");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Format client data for the prompt
    const clientName = client.name || "Unknown";
    const companyName = client.company || "Unknown";
    const position = client.position || "Unknown";
    const notes = client.notes || "No client notes available";
    const lastContact = client.lastContact 
      ? new Date(client.lastContact).toLocaleDateString() 
      : "Never contacted";
    
    // Format deal data for the prompt
    const dealTitle = deal.title || "Unnamed Deal";
    const dealStage = deal.status || "Unknown";
    const dealValue = deal.value ? `$${deal.value.toLocaleString()}` : "Not specified";
    const expectedCloseDate = deal.expectedCloseDate 
      ? new Date(deal.expectedCloseDate).toLocaleDateString() 
      : "No close date specified";
    
    // Format Google news for the prompt
    const recentNewsSection = googleData.length > 0
      ? "RECENT NEWS:\n" + googleData.slice(0, 3).map(item => 
          `- ${item.title || 'Untitled'} (${item.source || 'Unknown source'})`
        ).join('\n')
      : "RECENT NEWS:\nNo recent news available";
    
    // Format company info from PDL if available
    let companyInfoSection = "COMPANY INFORMATION:\nNo detailed company information available";
    if (pdlData && pdlData.companyData) {
      const companyData = pdlData.companyData;
      companyInfoSection = `COMPANY INFORMATION:
- Industry: ${companyData.industry || 'Unknown'}
- Size: ${companyData.size || companyData.employee_count || 'Unknown'} employees
- Location: ${companyData.location?.locality || ''}, ${companyData.location?.region || ''}
- Type: ${companyData.type || 'Unknown'}`;
    }
    
    // Create prompt
    const prompt = `
You are an expert sales intelligence analyst. Analyze this sales opportunity and provide deal intelligence:

CLIENT INFORMATION:
- Name: ${clientName}
- Position: ${position}
- Company: ${companyName}
- Last Contact: ${lastContact}

DEAL STATUS:
- Title: ${dealTitle}
- Current Stage: ${dealStage}
- Deal Value: ${dealValue}
- Expected Close Date: ${expectedCloseDate}

CLIENT NOTES:
${notes}

${companyInfoSection}

${recentNewsSection}

Based on this information, generate a comprehensive deal intelligence analysis in JSON format with these fields:

{
  "dealScore": 75, // Deal success probability (0-100%)
  "reasoning": "Reason for score based on client data",
  "currentStage": "${dealStage}",
  "stageData": {
    "currentStage": "${dealStage}",
    "timeInStage": "2 weeks", // Estimated time in current stage
    "completedStages": [], // Previous stages based on current stage
    "upcomingStages": [], // Future stages based on current stage
    "nextStageLikelihood": 70 // Probability of advancing to next stage (0-100%)
  },
  "factors": {
    "positive": [
      {"description": "Strong engagement with decision makers", "impact": 80},
      {"description": "Technical questions indicate serious evaluation", "impact": 75}
    ],
    "negative": [
      {"description": "Long time in current stage", "impact": 65},
      {"description": "Budget concerns mentioned", "impact": 55}
    ]
  },
  "requirements": [
    {"title": "Integration capability", "description": "Need to integrate with existing CRM"},
    {"title": "Security compliance", "description": "Must meet industry security standards"}
  ],
  "nextStage": {
    "timeframe": "2-3 weeks",
    "value": "${dealValue}",
    "blockers": ["Budget approval", "Technical validation"]
  },
  "recommendations": [
    "Schedule technical demo with IT department",
    "Provide detailed ROI analysis",
    "Address security concerns with documentation"
  ]
}

Return ONLY a valid JSON object with no additional text, comments, or markdown formatting.
Ensure your analysis is based on the available data. Use general sales knowledge where specific information is missing.
`;

    // Call GPT-4 API
    const response = await axios.post(OPENAI_API_URL, {
      messages: [{ role: "system", content: prompt }],
      max_tokens: config.gpt_settings?.max_completion_tokens || 800,
      temperature: config.gpt_settings?.temperature || 0.7
    }, {
      headers: {
        "Content-Type": "application/json",
        "api-key": OPENAI_API_KEY
      }
    });

    // Extract and parse response
    const responseContent = response.data.choices[0].message.content;
    
    try {
      // Parse JSON response
      const dealIntelligence = JSON.parse(responseContent);
      console.log("✅ Successfully generated and parsed deal intelligence");
      return dealIntelligence;
    } catch (parseError) {
      console.error("❌ Error parsing JSON response:", parseError.message);
      console.log("Raw response:", responseContent);
      
      // Try to extract JSON from markdown code block if present
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const extractedJson = JSON.parse(jsonMatch[1]);
          console.log("✅ Successfully extracted and parsed JSON from markdown");
          return extractedJson;
        } catch (extractError) {
          console.error("❌ Error parsing extracted JSON:", extractError.message);
        }
      }
      
      // Return fallback intelligence
      return createFallbackDealIntelligence(deal);
    }
  } catch (error) {
    console.error("❌ Error calling GPT for deal intelligence:", error.message);
    return createFallbackDealIntelligence(deal);
  }
}

/**
 * Create fallback deal intelligence when GPT fails
 * @param {Object} deal - Deal data
 * @return {Object} - Fallback deal intelligence
 */
function createFallbackDealIntelligence(deal) {
  const dealStage = deal.status || "prospecting";
  
  // Determine completed and upcoming stages
  const allStages = ["prospecting", "qualified", "proposal", "negotiation", "closed_won"];
  const currentIndex = allStages.indexOf(dealStage);
  const completedStages = currentIndex > 0 ? allStages.slice(0, currentIndex) : [];
  const upcomingStages = currentIndex < allStages.length - 1 ? allStages.slice(currentIndex + 1) : [];
  
  // Base score on deal stage
  const stageScores = {
    'prospecting': 30,
    'qualified': 50,
    'proposal': 70,
    'negotiation': 85,
    'closed_won': 100,
    'closed_lost': 0
  };
  
  const dealScore = stageScores[dealStage] || 50;
  
  return {
    dealScore,
    reasoning: "Generated based on deal stage and standard sales methodology",
    currentStage: dealStage,
    stageData: {
      currentStage: dealStage,
      timeInStage: "Unknown",
      completedStages,
      upcomingStages,
      nextStageLikelihood: dealScore + 10 > 100 ? 100 : dealScore + 10
    },
    factors: {
      positive: [
        {description: "Deal has progressed to " + dealStage + " stage", impact: 70},
        {description: "Deal value has been specified", impact: 60}
      ],
      negative: [
        {description: "Limited contextual data available", impact: 50},
        {description: "Standard industry challenges apply", impact: 40}
      ]
    },
    requirements: [
      {title: "Complete discovery", description: "Ensure all client requirements are documented"},
      {title: "Stakeholder mapping", description: "Identify all key decision makers"}
    ],
    nextStage: {
      timeframe: upcomingStages.length > 0 ? "2-4 weeks" : "N/A",
      value: deal.value ? `$${deal.value.toLocaleString()}` : "To be determined",
      blockers: ["Complete requirement validation", "Budget approval"]
    },
    recommendations: [
      "Schedule follow-up meeting to address remaining questions",
      "Provide detailed case studies from similar clients",
      "Create customized implementation plan",
      "Focus on unique value proposition"
    ]
  };
}

/**
 * Store message for clients with no deals
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @param {string} companyName - Company name
 * @return {Promise<Object>} - Update result
 */
async function storeNoDealsMessage(clientId, userId, companyName) {
  // Create special intelligence object for no deals
  const noDealsIntelligence = {
    dealScore: 0,
    reasoning: "Client has no deals",
    message: "You do not have any active deals",
    hasDeals: false,
    currentStage: "none",
    stageData: {
      currentStage: "none",
      completedStages: [],
      upcomingStages: []
    },
    factors: {
      positive: [],
      negative: []
    },
    requirements: [],
    nextStage: {},
    recommendations: [
      "Create a new deal for this client",
      "Define initial opportunity parameters",
      "Schedule discovery meeting"
    ]
  };
  
  return await updateResearchWithDealIntelligence(clientId, userId, companyName, noDealsIntelligence);
}

/**
 * Store message for clients with only closed deals
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @param {string} companyName - Company name
 * @return {Promise<Object>} - Update result
 */
async function storeClosedDealsMessage(clientId, userId, companyName) {
  // Create special intelligence object for closed deals
  const closedDealsIntelligence = {
    dealScore: 0,
    reasoning: "Client has only closed deals",
    message: "Deal prediction is only for active deal clients only",
    hasDeals: true,
    hasActiveDeals: false,
    currentStage: "closed",
    stageData: {
      currentStage: "closed",
      completedStages: ["prospecting", "qualified", "proposal", "negotiation", "closed_won"],
      upcomingStages: []
    },
    factors: {
      positive: [],
      negative: []
    },
    requirements: [],
    nextStage: {},
    recommendations: [
      "Review closed deals for upsell opportunities",
      "Schedule follow-up for customer satisfaction",
      "Explore expansion possibilities"
    ]
  };
  
  return await updateResearchWithDealIntelligence(clientId, userId, companyName, closedDealsIntelligence);
}

/**
 * Store deal intelligence in the research collection
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @param {string} companyName - Company name
 * @param {Object} dealIntelligence - Deal intelligence data
 * @return {Promise<Object>} - Update result
 */
async function storeDealIntelligence(clientId, userId, companyName, dealIntelligence) {
  return await updateResearchWithDealIntelligence(clientId, userId, companyName, dealIntelligence);
}

/**
 * Update research document with deal intelligence
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @param {string} companyName - Company name
 * @param {Object} dealIntelligence - Deal intelligence data
 * @return {Promise<Object>} - Update result
 */
async function updateResearchWithDealIntelligence(clientId, userId, companyName, dealIntelligence) {
  const now = new Date();
  
  try {
    // Update the research document
    const updateResult = await Research.updateOne(
      { clientId, userId },
      {
        $set: {
          'data.dealIntelligence': dealIntelligence,
          'lastUpdated.dealIntelligence': now,
          clientId,
          userId,
          company: companyName,
          companyName,
          timestamp: now
        }
      },
      { upsert: true }
    );
    
    return updateResult;
  } catch (error) {
    console.error(`❌ Error updating research document with deal intelligence:`, error.message);
    throw error;
  }
}

// Export functions
module.exports = {
  generateDealIntelligence,
  processAllClientDeals
};