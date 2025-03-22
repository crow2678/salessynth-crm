// /agentic/research/DealSummary.js
const axios = require('axios');
const { Research, Client } = require('../database/db');
const fs = require('fs');
const path = require('path');
const { 
  INDUSTRY_SALES_STRATEGIES, 
  DEAL_STAGES, 
  NOTE_PATTERNS 
} = require('./researchConstants');
const { 
  extractQuestionsAndRequirements, 
  extractDecisionPoints,
  extractUpcomingEvents
} = require('./researchUtils');
require("dotenv").config();

// Load config dynamically
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Constants
const OPENAI_API_URL = "https://88f.openai.azure.com/openai/deployments/88FGPT4o/chat/completions?api-version=2024-02-15-preview";
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const ACTIVE_DEAL_STATUSES = ['prospecting', 'qualified', 'proposal', 'negotiation'];

// Deal stage mapping for various sales methodologies
const DEAL_STAGE_MAPPING = {
  'default': {
    stages: ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    stagePriorities: {
      'negotiation': 4,
      'proposal': 3,
      'qualified': 2,
      'prospecting': 1,
      'closed_won': 0,
      'closed_lost': 0
    }
  },
  'enterprise': {
    stages: ['discovery', 'qualification', 'solution', 'proposal', 'contract', 'closed'],
    stagePriorities: {
      'contract': 5,
      'proposal': 4,
      'solution': 3,
      'qualification': 2,
      'discovery': 1,
      'closed': 0
    }
  },
  'solution': {
    stages: ['identify', 'validate', 'design', 'propose', 'finalize', 'closed'],
    stagePriorities: {
      'finalize': 5,
      'propose': 4,
      'design': 3,
      'validate': 2,
      'identify': 1,
      'closed': 0
    }
  }
};

// Prevent duplicate processing
const runningProcesses = new Set();

/**
 * Generate intelligence for a client's active deals
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @param {string} salesMethodology - Optional sales methodology for stage mapping
 * @return {Promise<boolean>} - Success status
 */
async function generateDealIntelligence(clientId, userId, salesMethodology = 'default') {
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

    // Get existing research
    const existingResearch = await Research.findOne({ clientId, userId });
    
    // Get the most advanced deal (primary deal)
    const stageMapping = DEAL_STAGE_MAPPING[salesMethodology] || DEAL_STAGE_MAPPING.default;
    const primaryDeal = getHighestPriorityDeal(activeDeals, stageMapping.stagePriorities);
    
    // Add dealTimeInStage if available
    const now = new Date();
    if (primaryDeal.lastUpdated) {
      const daysSinceUpdate = Math.floor((now - new Date(primaryDeal.lastUpdated)) / (1000 * 60 * 60 * 24));
      primaryDeal.daysInStage = daysSinceUpdate;
    }
    
    // Fetch research data for context
    let googleData = [];
    let pdlData = null;
    let redditData = [];
    
    if (existingResearch && existingResearch.data) {
      if (existingResearch.data.google && Array.isArray(existingResearch.data.google)) {
        googleData = existingResearch.data.google;
      }
      
      if (existingResearch.data.pdl) {
        pdlData = existingResearch.data.pdl;
      }
      
      if (existingResearch.data.reddit && Array.isArray(existingResearch.data.reddit)) {
        redditData = existingResearch.data.reddit;
      }
    }

    // Extract structured data from client notes
    const notesData = analyzeClientNotes(client.notes || '');
    
    // Determine industry for industry-specific recommendations
    let industry = 'default';
    if (pdlData && pdlData.companyData && pdlData.companyData.industry) {
      industry = pdlData.companyData.industry.toLowerCase();
    }
    
    // Generate deal intelligence using GPT
    const dealIntelligence = await callGPTForDealIntelligence(
      client, 
      primaryDeal, 
      googleData, 
      pdlData,
      redditData,
      notesData,
      industry,
      stageMapping
    );
    
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
 * @param {string} salesMethodology - Optional sales methodology for stage mapping
 * @return {Promise<void>}
 */
async function processAllClientDeals(salesMethodology = 'default') {
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
        batch.map(client => generateDealIntelligence(client._id.toString(), client.userId, salesMethodology))
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
 * Analyze client notes to extract structured insights
 * @param {string} notes - Client notes
 * @return {Object} - Structured data from notes
 */
function analyzeClientNotes(notes) {
  if (!notes) return {};
  
  const questionsData = extractQuestionsAndRequirements(notes);
  const decisionPoints = extractDecisionPoints(notes);
  const upcomingEvents = extractUpcomingEvents(notes);
  
  // Detect concerns in notes
  const concernMatches = [];
  for (const pattern of NOTE_PATTERNS.concerns) {
    const matches = notes.match(new RegExp(pattern.source, pattern.flags + 'g')) || [];
    concernMatches.push(...matches);
  }
  
  // Detect positive signals in notes
  const positiveMatches = [];
  for (const pattern of NOTE_PATTERNS.positiveIndicators) {
    const matches = notes.match(new RegExp(pattern.source, pattern.flags + 'g')) || [];
    positiveMatches.push(...matches);
  }
  
  // Detect negative signals in notes
  const negativeMatches = [];
  for (const pattern of NOTE_PATTERNS.negativeIndicators) {
    const matches = notes.match(new RegExp(pattern.source, pattern.flags + 'g')) || [];
    negativeMatches.push(...matches);
  }
  
  return {
    questions: questionsData.questions,
    requirements: questionsData.requirements,
    decisionPoints,
    upcomingEvents,
    concerns: concernMatches,
    positiveSignals: positiveMatches,
    negativeSignals: negativeMatches
  };
}

/**
 * Get the highest priority deal based on stage and value
 * @param {Array} deals - List of deals
 * @param {Object} stagePriorities - Priority mapping for stages
 * @return {Object} - Highest priority deal
 */
function getHighestPriorityDeal(deals, stagePriorities) {
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
 * Determine the most relevant industry strategy
 * @param {string} industry - Industry name
 * @return {Object} - Industry strategy
 */
function getIndustryStrategy(industry) {
  if (!industry) return INDUSTRY_SALES_STRATEGIES.default;
  
  const normalizedIndustry = industry.toLowerCase();
  
  // Direct match
  if (INDUSTRY_SALES_STRATEGIES[normalizedIndustry]) {
    return INDUSTRY_SALES_STRATEGIES[normalizedIndustry];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(INDUSTRY_SALES_STRATEGIES)) {
    if (normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) {
      return value;
    }
  }
  
  return INDUSTRY_SALES_STRATEGIES.default;
}

/**
 * Build a dynamic GPT prompt based on available data
 * @param {Object} data - All available data for analysis
 * @return {string} - Constructed prompt
 */
function buildDynamicPrompt(data) {
  const {
    client,
    deal,
    googleData,
    pdlData,
    redditData,
    notesData,
    industryStrategy,
    stageMapping
  } = data;
  
  // Basic client and deal information
  const clientName = client.name || "Unknown";
  const companyName = client.company || "Unknown";
  const position = client.position || "Unknown";
  const notes = client.notes || "No client notes available";
  const lastContact = client.lastContact 
    ? new Date(client.lastContact).toLocaleDateString() 
    : "Never contacted";
  
  const dealTitle = deal.title || "Unnamed Deal";
  const dealStage = deal.status || "Unknown";
  const dealValue = deal.value ? `$${deal.value.toLocaleString()}` : "Not specified";
  const expectedCloseDate = deal.expectedCloseDate 
    ? new Date(deal.expectedCloseDate).toLocaleDateString() 
    : "No close date specified";
  const daysInStage = deal.daysInStage ? `${deal.daysInStage} days` : "Unknown";
  
  // Section: Deal stage context
  const stageInfo = DEAL_STAGES[dealStage] || {};
  const focusAreas = stageInfo.focusAreas 
    ? `Focus areas for ${dealStage} stage: ${stageInfo.focusAreas.join(', ')}`
    : "";
  
  // Current position in sales process
  const allStages = stageMapping.stages;
  const currentIndex = allStages.indexOf(dealStage);
  const completedStages = currentIndex > 0 ? allStages.slice(0, currentIndex) : [];
  const upcomingStages = currentIndex < allStages.length - 1 ? allStages.slice(currentIndex + 1) : [];
  
  // Include only if available
  let companyInfoSection = "";
  if (pdlData && pdlData.companyData) {
    const companyData = pdlData.companyData;
    companyInfoSection = `
COMPANY INFORMATION:
- Industry: ${companyData.industry || 'Unknown'}
- Size: ${companyData.size || companyData.employee_count || 'Unknown'} employees
- Location: ${companyData.location?.locality || ''}, ${companyData.location?.region || ''}
- Type: ${companyData.type || 'Unknown'}`;
  }
  
  // Include only if available
  let recentNewsSection = "";
  if (googleData && googleData.length > 0) {
    recentNewsSection = `
RECENT NEWS:
${googleData.slice(0, 3).map(item => 
  `- ${item.title || 'Untitled'} (${item.source || 'Unknown source'})`
).join('\n')}`;
  }
  
  // Include only if available and relevant
  let clientNotesInsightsSection = "";
  if (notesData && Object.keys(notesData).length > 0) {
    const hasQuestions = notesData.questions && notesData.questions.length > 0;
    const hasRequirements = notesData.requirements && notesData.requirements.length > 0;
    const hasDecisionPoints = notesData.decisionPoints && notesData.decisionPoints.length > 0;
    
    if (hasQuestions || hasRequirements || hasDecisionPoints) {
      clientNotesInsightsSection = `
INSIGHTS FROM CLIENT NOTES:
${hasQuestions ? `Client Questions:\n${notesData.questions.map(q => `- ${q}`).join('\n')}` : ''}
${hasRequirements ? `Requirements:\n${notesData.requirements.map(r => `- ${r}`).join('\n')}` : ''}
${hasDecisionPoints ? `Decision Points:\n${notesData.decisionPoints.map(d => `- ${d}`).join('\n')}` : ''}`;
    }
  }
  
  // Industry-specific section
  const industrySection = `
INDUSTRY-SPECIFIC CONTEXT:
- Key Topics: ${industryStrategy.topics.slice(0, 3).join(', ')}
- Common Objections: ${industryStrategy.objections.slice(0, 3).join(', ')}
- Technical Terms: ${industryStrategy.technicalTerms.slice(0, 3).join(', ')}`;
  
  // Main prompt with IMPROVED template that avoids hardcoded values
  return `
You are an expert sales intelligence analyst specializing in ${industryStrategy.topics[0] || 'business'} sales. Analyze this sales opportunity and provide deal intelligence:

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
- Time in Current Stage: ${daysInStage}
- Sales Process: ${completedStages.join(' → ')} → [${dealStage}] → ${upcomingStages.join(' → ')}
${focusAreas ? `- ${focusAreas}` : ''}

CLIENT NOTES:
${notes}
${clientNotesInsightsSection}
${companyInfoSection}
${recentNewsSection}
${industrySection}

IMPORTANT: Analyze this specific deal carefully and calculate a unique deal score based on the exact circumstances.
- High scores (80-100): Strong engagement, advanced stages, minimal red flags
- Medium scores (50-79): Good progress but some concerns or unknowns
- Low scores (0-49): Significant issues, early stages, or major concerns

For each deal, consider:
1. Deal stage progression and time in current stage
2. Client engagement (questions, requirements mentioned)
3. Deal complexity and value
4. Industry-specific success factors
5. Identified risk factors

Return a comprehensive deal intelligence analysis in JSON format with these fields:

{
  "dealScore": null,
  "reasoning": "",
  "confidence": null,
  "currentStage": "${dealStage}",
  "stageData": {
    "currentStage": "${dealStage}",
    "timeInStage": "${daysInStage}",
    "completedStages": ${JSON.stringify(completedStages)},
    "upcomingStages": ${JSON.stringify(upcomingStages)},
    "nextStageLikelihood": null
  },
  "momentum": "",
  "factors": {
    "positive": [
      {"description": "", "impact": null}
    ],
    "negative": [
      {"description": "", "impact": null}
    ]
  },
  "requirements": [
    {"title": "", "description": ""}
  ],
  "nextStage": {
    "timeframe": "",
    "value": "${dealValue}",
    "blockers": []
  },
  "recommendations": []
}

Return ONLY a valid JSON object with no additional text, comments, or markdown formatting.
Ensure your analysis is based on the available data and industry context. Make recommendations specific to this client's situation and stage.
`;
}
/**
 * Call GPT to generate deal intelligence
 * @param {Object} client - Client data
 * @param {Object} deal - Deal data
 * @param {Array} googleData - Google research data
 * @param {Object} pdlData - PDL company data
 * @param {Array} redditData - Reddit discussion data
 * @param {Object} notesData - Structured data from client notes
 * @param {string} industry - Client industry
 * @param {Object} stageMapping - Deal stage mapping
 * @return {Promise<Object>} - Deal intelligence data
 */
async function callGPTForDealIntelligence(
  client, 
  deal, 
  googleData = [], 
  pdlData = null,
  redditData = [],
  notesData = {},
  industry = 'default',
  stageMapping = DEAL_STAGE_MAPPING.default
) {
  try {
    console.log("🧠 Generating GPT-based deal intelligence...");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Get industry-specific strategy
    const industryStrategy = getIndustryStrategy(industry);
    
    // Build dynamic prompt based on available data
    const prompt = buildDynamicPrompt({
      client,
      deal,
      googleData,
      pdlData,
      redditData,
      notesData,
      industryStrategy,
      stageMapping
    });

    // Log prompt length for debugging
    console.log(`Prompt length: ${prompt.length} characters`);

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

    // Extract response
    const responseContent = response.data.choices[0].message.content;
    
    try {
      // Attempt to parse JSON response directly
      const dealIntelligence = JSON.parse(responseContent.trim());
      console.log("✅ Successfully generated and parsed deal intelligence");
      console.log(`🎯 Deal score: ${dealIntelligence.dealScore}%`);
      
      // Ensure dealScore is a number between 0-100
      if (typeof dealIntelligence.dealScore !== 'number' || 
          dealIntelligence.dealScore < 0 || 
          dealIntelligence.dealScore > 100) {
        // Generate a score based on deal stage if invalid
        dealIntelligence.dealScore = generateScoreFromStage(deal.status);
        console.log(`⚠️ Invalid deal score, using generated score: ${dealIntelligence.dealScore}%`);
      }
      
      // Add metadata
      dealIntelligence.generatedAt = new Date().toISOString();
      dealIntelligence.dataQuality = calculateDataQuality(client, googleData, pdlData, notesData);
      
      return dealIntelligence;
    } catch (parseError) {
      console.error("❌ Error parsing JSON response:", parseError.message);
      
      // Advanced JSON extraction with flexible pattern matching
      try {
        // Try to extract JSON from markdown code block if present
        const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const extractedJson = JSON.parse(jsonMatch[1].trim());
          console.log("✅ Successfully extracted and parsed JSON from markdown");
          console.log(`🎯 Deal score: ${extractedJson.dealScore}%`);
          
          // Ensure dealScore is a number between 0-100
          if (typeof extractedJson.dealScore !== 'number' || 
              extractedJson.dealScore < 0 || 
              extractedJson.dealScore > 100) {
            // Generate a score based on deal stage if invalid
            extractedJson.dealScore = generateScoreFromStage(deal.status);
            console.log(`⚠️ Invalid deal score, using generated score: ${extractedJson.dealScore}%`);
          }
          
          // Add metadata
          extractedJson.generatedAt = new Date().toISOString();
          extractedJson.dataQuality = calculateDataQuality(client, googleData, pdlData, notesData);
          
          return extractedJson;
        }
        
        // Try to find JSON-like structure with flexible regex
        const jsonRegex = /{[\s\S]*}/;
        const possibleJson = responseContent.match(jsonRegex);
        if (possibleJson) {
          const extractedJson = JSON.parse(possibleJson[0]);
          console.log("✅ Successfully extracted JSON with flexible matching");
          console.log(`🎯 Deal score: ${extractedJson.dealScore}%`);
          
          // Ensure dealScore is a number between 0-100
          if (typeof extractedJson.dealScore !== 'number' || 
              extractedJson.dealScore < 0 || 
              extractedJson.dealScore > 100) {
            // Generate a score based on deal stage if invalid
            extractedJson.dealScore = generateScoreFromStage(deal.status);
            console.log(`⚠️ Invalid deal score, using generated score: ${extractedJson.dealScore}%`);
          }
          
          // Add metadata
          extractedJson.generatedAt = new Date().toISOString();
          extractedJson.dataQuality = calculateDataQuality(client, googleData, pdlData, notesData);
          
          return extractedJson;
        }
      } catch (extractError) {
        console.error("❌ Error extracting JSON:", extractError.message);
      }
      
      // If all JSON parsing attempts fail, return fallback
      console.log("⚠️ Using fallback deal intelligence generation");
      return createFallbackDealIntelligence(deal, client, industry, stageMapping);
    }
  } catch (error) {
    console.error("❌ Error calling GPT for deal intelligence:", error.message);
    return createFallbackDealIntelligence(deal, client, industry, stageMapping);
  }
}

/**
 * Generate a score based on deal stage with some randomness
 * @param {string} stage - Deal stage
 * @return {number} - Generated score
 */
function generateScoreFromStage(stage) {
  // Base scores by stage
  const baseScores = {
    'prospecting': 35,
    'qualified': 55,
    'proposal': 70,
    'negotiation': 85,
    'closed_won': 100,
    'closed_lost': 0
  };
  
  // Get base score or default to 50
  const baseScore = baseScores[stage] || 50;
  
  // Add randomness (+/- 15%)
  const randomFactor = Math.floor(Math.random() * 31) - 15;
  
  // Return score bounded between 0-100
  return Math.max(0, Math.min(100, baseScore + randomFactor));
}

/**
 * Calculate data quality score based on available data
 * @param {Object} client - Client data
 * @param {Array} googleData - Google research data
 * @param {Object} pdlData - PDL company data
 * @param {Object} notesData - Structured data from client notes
 * @return {number} - Data quality score (0-100)
 */
function calculateDataQuality(client, googleData, pdlData, notesData) {
  let score = 50; // Base score
  
  // Client data quality
  if (client.notes && client.notes.length > 100) score += 10;
  if (client.lastContact) score += 5;
  
  // Research data quality
  if (googleData && googleData.length > 0) score += 10;
  if (pdlData && pdlData.companyData) score += 10;
  
  // Notes analysis quality
  if (notesData && notesData.questions && notesData.questions.length > 0) score += 5;
  if (notesData && notesData.requirements && notesData.requirements.length > 0) score += 5;
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, score));
}

/**
 * Create fallback deal intelligence when GPT fails
 * @param {Object} deal - Deal data
 * @param {Object} client - Client data
 * @param {string} industry - Client industry
 * @param {Object} stageMapping - Deal stage mapping
 * @return {Object} - Fallback deal intelligence
 */
function createFallbackDealIntelligence(deal, client, industry = 'default', stageMapping = DEAL_STAGE_MAPPING.default) {
  const dealStage = deal.status || "prospecting";
  
  // Determine completed and upcoming stages
  const allStages = stageMapping.stages;
  const currentIndex = allStages.indexOf(dealStage);
  const completedStages = currentIndex > 0 ? allStages.slice(0, currentIndex) : [];
  const upcomingStages = currentIndex < allStages.length - 1 ? allStages.slice(currentIndex + 1) : [];
  
  // Generate a varying score based on stage with randomness
  const dealScore = generateScoreFromStage(dealStage);
  
  // Get industry strategy
  const industryStrategy = getIndustryStrategy(industry);
  
  // Create tailored recommendations based on industry
  const recommendations = [
    `Focus on ${industryStrategy.topics[0] || 'value proposition'} in your next communication`,
    `Prepare responses to common ${industryStrategy.objections[0] || 'objections'} for this industry`,
    `Schedule follow-up meeting to address remaining questions`,
    `Create customized implementation plan focusing on ${industryStrategy.topics[1] || 'ROI'}`
  ];
  
  return {
    dealScore,
    reasoning: `Generated based on deal stage (${dealStage}) and standard sales methodology for ${industry || 'general'} industry`,
    confidence: 50, // Medium confidence since this is fallback
    currentStage: dealStage,
    stageData: {
      currentStage: dealStage,
      timeInStage: deal.daysInStage ? `${deal.daysInStage} days` : "Unknown",
      completedStages,
      upcomingStages,
      nextStageLikelihood: Math.min(100, dealScore + 10) // Slightly higher than deal score
    },
    momentum: dealScore > 70 ? "Steady" : "Needs Attention",
    factors: {
      positive: [
        {description: `Deal has progressed to ${dealStage} stage`, impact: 70},
        {description: `Deal value has been specified (${deal.value ? '$' + deal.value.toLocaleString() : 'unknown'})`, impact: 60}
      ],
      negative: [
        {description: "Limited contextual data available for analysis", impact: 50},
        {description: `Standard challenges for ${industry || 'this'} industry apply`, impact: 40}
      ]
    },
    requirements: [
      {title: "Complete discovery", description: "Ensure all client requirements are documented"},
      {title: `Address ${industryStrategy.objections[0] || 'common objections'}`, description: `Prepare materials to overcome ${industryStrategy.objections[0] || 'objections'}`}
    ],
    nextStage: {
      timeframe: upcomingStages.length > 0 ? "2-4 weeks" : "N/A",
      value: deal.value ? `$${deal.value.toLocaleString()}` : "To be determined",
      blockers: ["Complete requirement validation", "Budget approval"]
    },
    recommendations,
    generatedAt: new Date().toISOString(),
    dataQuality: 30 // Low quality since this is fallback
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