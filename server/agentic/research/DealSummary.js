// /agentic/research/DealSummary.js - ENHANCED VERSION
// Part 1: Imports, Constants, and Enhanced Configuration

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

// Enhanced Constants with Intelligence Features
const OPENAI_API_URL = "https://88f.openai.azure.com/openai/deployments/88FGPT4o/chat/completions?api-version=2024-02-15-preview";
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const ACTIVE_DEAL_STATUSES = ['prospecting', 'qualified', 'proposal', 'negotiation'];

// Enhanced Deal Intelligence Configuration
const INTELLIGENCE_CONFIG = {
  scoring: {
    // Base scores by stage with enhanced weighting
    stageScores: {
      'prospecting': { base: 25, variance: 15 },
      'qualified': { base: 45, variance: 20 },
      'proposal': { base: 65, variance: 15 },
      'negotiation': { base: 80, variance: 10 },
      'closed_won': { base: 100, variance: 0 },
      'closed_lost': { base: 0, variance: 0 }
    },
    // Momentum multipliers
    momentum: {
      accelerating: 1.15,    // 15% boost for improving deals
      steady: 1.0,           // No change for stable deals
      stalling: 0.85,        // 15% penalty for declining deals
      declining: 0.7         // 30% penalty for troubled deals
    },
    // Time in stage penalties (days)
    timeInStagePenalty: {
      'prospecting': { threshold: 14, penalty: 0.95 },  // 5% penalty after 2 weeks
      'qualified': { threshold: 21, penalty: 0.9 },     // 10% penalty after 3 weeks
      'proposal': { threshold: 30, penalty: 0.85 },     // 15% penalty after 1 month
      'negotiation': { threshold: 45, penalty: 0.8 }    // 20% penalty after 6 weeks
    },
    // Engagement multipliers based on client interaction
    engagement: {
      high: 1.2,      // Multiple questions, requirements, active communication
      medium: 1.0,    // Some interaction
      low: 0.85       // Minimal interaction
    }
  },
  confidence: {
    // Data quality impact on confidence
    dataQualityWeights: {
      clientNotes: 0.3,
      companyResearch: 0.25,
      newsData: 0.2,
      contactHistory: 0.15,
      dealDetails: 0.1
    },
    // Minimum confidence threshold
    minimumConfidence: 30
  },
  risk: {
    // Risk factor thresholds
    highRisk: 40,
    mediumRisk: 65,
    // Common risk indicators
    riskFactors: {
      'long_time_in_stage': { threshold: 30, impact: -15 },
      'no_recent_contact': { threshold: 14, impact: -10 },
      'budget_concerns': { pattern: /budget|cost|price|expensive/i, impact: -12 },
      'competition_mentioned': { pattern: /competitor|alternative|other vendor/i, impact: -8 },
      'delayed_responses': { pattern: /delay|postpone|reschedule/i, impact: -10 }
    }
  }
};

// Enhanced Deal Stage Mapping with Intelligence Features
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
    },
    // Typical time in each stage (days) for benchmarking
    typicalDuration: {
      'prospecting': 14,
      'qualified': 21,
      'proposal': 30,
      'negotiation': 45
    },
    // Success probability by stage
    successProbability: {
      'prospecting': 15,
      'qualified': 35,
      'proposal': 65,
      'negotiation': 85,
      'closed_won': 100,
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
    },
    typicalDuration: {
      'discovery': 21,
      'qualification': 28,
      'solution': 35,
      'proposal': 42,
      'contract': 60
    },
    successProbability: {
      'discovery': 12,
      'qualification': 25,
      'solution': 45,
      'proposal': 70,
      'contract': 90,
      'closed': 100
    }
  }
};

// Enhanced Risk Detection Patterns
const ENHANCED_RISK_PATTERNS = {
  budget: [
    /no budget/i, /budget cut/i, /expensive/i, /too costly/i, /price/i, /cost/i
  ],
  timeline: [
    /delay/i, /postpone/i, /push back/i, /not urgent/i, /no rush/i, /later/i
  ],
  competition: [
    /other vendor/i, /competitor/i, /alternative/i, /comparing/i, /shopping around/i
  ],
  authority: [
    /need approval/i, /check with/i, /not my decision/i, /boss/i, /management/i
  ],
  engagement: [
    /busy/i, /unavailable/i, /no time/i, /reschedule/i, /cancel/i
  ]
};

// Positive Signal Patterns for Momentum Detection
const POSITIVE_SIGNAL_PATTERNS = {
  urgency: [
    /urgent/i, /asap/i, /soon/i, /quickly/i, /fast track/i, /priority/i
  ],
  commitment: [
    /moving forward/i, /next step/i, /proceed/i, /approve/i, /excited/i, /interested/i
  ],
  expansion: [
    /additional/i, /more/i, /expand/i, /grow/i, /scale/i, /other departments/i
  ],
  timeline: [
    /by \w+ \d+/i, /deadline/i, /target date/i, /go live/i, /implementation/i
  ]
};

// Prevent duplicate processing
const runningProcesses = new Set();

// Performance tracking
const performanceMetrics = {
  processingTimes: [],
  successRate: 0,
  totalProcessed: 0
};
// Part 2: Enhanced Scoring Algorithms and Intelligence Functions

/**
 * Calculate enhanced deal score with momentum, engagement, and risk factors
 * @param {Object} deal - Deal object
 * @param {Object} client - Client object
 * @param {Object} notesData - Analyzed notes data
 * @param {string} salesMethodology - Sales methodology being used
 * @return {Object} - Enhanced scoring results
 */
function calculateEnhancedDealScore(deal, client, notesData = {}, salesMethodology = 'default') {
  const stageMapping = DEAL_STAGE_MAPPING[salesMethodology] || DEAL_STAGE_MAPPING.default;
  const dealStage = deal.status || 'prospecting';
  
  // Base score from stage
  const stageConfig = INTELLIGENCE_CONFIG.scoring.stageScores[dealStage] || 
                     INTELLIGENCE_CONFIG.scoring.stageScores['prospecting'];
  let baseScore = stageConfig.base;
  
  // Add controlled randomness within variance range
  const variance = Math.floor(Math.random() * (stageConfig.variance * 2)) - stageConfig.variance;
  baseScore += variance;
  
  // Calculate momentum multiplier
  const momentumData = calculateDealMomentum(deal, client, notesData);
  const momentumMultiplier = INTELLIGENCE_CONFIG.scoring.momentum[momentumData.momentum] || 1.0;
  
  // Calculate engagement multiplier
  const engagementLevel = calculateEngagementLevel(client, notesData);
  const engagementMultiplier = INTELLIGENCE_CONFIG.scoring.engagement[engagementLevel];
  
  // Apply time-in-stage penalty
  const timeInStagePenalty = calculateTimeInStagePenalty(deal, dealStage);
  
  // Calculate risk factors
  const riskFactors = calculateRiskFactors(deal, client, notesData);
  const riskPenalty = riskFactors.reduce((total, risk) => total + risk.impact, 0);
  
  // Calculate final score
  let finalScore = baseScore * momentumMultiplier * engagementMultiplier * timeInStagePenalty;
  finalScore += riskPenalty; // Risk penalty is additive (negative values)
  
  // Ensure score stays within 0-100 bounds
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
  
  // Calculate confidence level
  const confidence = calculateConfidenceScore(client, notesData, riskFactors.length);
  
  return {
    score: finalScore,
    confidence,
    momentum: momentumData,
    engagement: engagementLevel,
    riskFactors,
    timeInStage: deal.daysInStage || 0,
    stageProgress: calculateStageProgress(dealStage, stageMapping),
    benchmark: {
      typicalDuration: stageMapping.typicalDuration[dealStage] || 30,
      successProbability: stageMapping.successProbability[dealStage] || 50
    }
  };
}

/**
 * Calculate deal momentum based on various signals
 * @param {Object} deal - Deal object
 * @param {Object} client - Client object  
 * @param {Object} notesData - Analyzed notes data
 * @return {Object} - Momentum analysis
 */
function calculateDealMomentum(deal, client, notesData) {
  let momentumScore = 0;
  const signals = [];
  const notes = client.notes || '';
  
  // Positive signals analysis
  Object.entries(POSITIVE_SIGNAL_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      if (pattern.test(notes)) {
        momentumScore += 5;
        signals.push({ type: 'positive', category, signal: 'Pattern matched in notes' });
      }
    });
  });
  
  // Questions and engagement signals
  if (notesData.questions && notesData.questions.length > 0) {
    momentumScore += Math.min(notesData.questions.length * 2, 10); // Max 10 points
    signals.push({ type: 'positive', category: 'engagement', signal: `${notesData.questions.length} questions asked` });
  }
  
  // Requirements gathering signals
  if (notesData.requirements && notesData.requirements.length > 0) {
    momentumScore += Math.min(notesData.requirements.length * 3, 15); // Max 15 points
    signals.push({ type: 'positive', category: 'requirements', signal: `${notesData.requirements.length} requirements identified` });
  }
  
  // Recent contact positive signal
  if (client.lastContact) {
    const daysSinceContact = Math.floor((new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24));
    if (daysSinceContact <= 7) {
      momentumScore += 8;
      signals.push({ type: 'positive', category: 'contact', signal: 'Recent contact within 7 days' });
    } else if (daysSinceContact <= 14) {
      momentumScore += 4;
      signals.push({ type: 'positive', category: 'contact', signal: 'Contact within 2 weeks' });
    }
  }
  
  // Negative signals analysis
  Object.entries(ENHANCED_RISK_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      if (pattern.test(notes)) {
        momentumScore -= 8;
        signals.push({ type: 'negative', category, signal: 'Risk pattern detected in notes' });
      }
    });
  });
  
  // Time stagnation penalty
  if (deal.daysInStage && deal.daysInStage > 45) {
    momentumScore -= 15;
    signals.push({ type: 'negative', category: 'timeline', signal: `Stagnant for ${deal.daysInStage} days` });
  } else if (deal.daysInStage && deal.daysInStage > 30) {
    momentumScore -= 8;
    signals.push({ type: 'negative', category: 'timeline', signal: `Slow progress: ${deal.daysInStage} days in stage` });
  }
  
  // Determine momentum category
  let momentum;
  if (momentumScore >= 15) momentum = 'accelerating';
  else if (momentumScore >= 5) momentum = 'steady';
  else if (momentumScore >= -10) momentum = 'stalling';
  else momentum = 'declining';
  
  return {
    momentum,
    score: momentumScore,
    signals: signals.slice(0, 5), // Limit to top 5 signals
    description: getMomentumDescription(momentum, momentumScore)
  };
}

/**
 * Calculate engagement level based on client interaction
 * @param {Object} client - Client object
 * @param {Object} notesData - Analyzed notes data
 * @return {string} - Engagement level (high/medium/low)
 */
function calculateEngagementLevel(client, notesData) {
  let engagementScore = 0;
  
  // Notes quality and length
  if (client.notes) {
    if (client.notes.length > 500) engagementScore += 3;
    else if (client.notes.length > 200) engagementScore += 2;
    else if (client.notes.length > 50) engagementScore += 1;
  }
  
  // Questions asked by client
  if (notesData.questions) {
    engagementScore += Math.min(notesData.questions.length, 4);
  }
  
  // Requirements provided
  if (notesData.requirements) {
    engagementScore += Math.min(notesData.requirements.length, 3);
  }
  
  // Decision points identified
  if (notesData.decisionPoints) {
    engagementScore += Math.min(notesData.decisionPoints.length, 2);
  }
  
  // Recent contact frequency
  if (client.lastContact) {
    const daysSinceContact = Math.floor((new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24));
    if (daysSinceContact <= 3) engagementScore += 2;
    else if (daysSinceContact <= 7) engagementScore += 1;
  }
  
  // Determine engagement level
  if (engagementScore >= 8) return 'high';
  else if (engagementScore >= 4) return 'medium';
  else return 'low';
}

/**
 * Calculate time-in-stage penalty multiplier
 * @param {Object} deal - Deal object
 * @param {string} dealStage - Current deal stage
 * @return {number} - Penalty multiplier (0.8 to 1.0)
 */
function calculateTimeInStagePenalty(deal, dealStage) {
  if (!deal.daysInStage) return 1.0;
  
  const stageConfig = INTELLIGENCE_CONFIG.scoring.timeInStagePenalty[dealStage];
  if (!stageConfig) return 1.0;
  
  if (deal.daysInStage > stageConfig.threshold) {
    return stageConfig.penalty;
  }
  
  return 1.0;
}

/**
 * Calculate risk factors affecting the deal
 * @param {Object} deal - Deal object
 * @param {Object} client - Client object
 * @param {Object} notesData - Analyzed notes data
 * @return {Array} - Array of risk factors
 */
function calculateRiskFactors(deal, client, notesData) {
  const risks = [];
  const notes = client.notes || '';
  
  // Time-based risks
  if (deal.daysInStage && deal.daysInStage > 60) {
    risks.push({
      type: 'timeline',
      severity: 'high',
      description: `Deal stagnant for ${deal.daysInStage} days`,
      impact: -20,
      recommendation: 'Schedule urgent review meeting to identify blockers'
    });
  } else if (deal.daysInStage && deal.daysInStage > 30) {
    risks.push({
      type: 'timeline',
      severity: 'medium',
      description: `Slow progress: ${deal.daysInStage} days in current stage`,
      impact: -10,
      recommendation: 'Identify and address potential obstacles'
    });
  }
  
  // Contact recency risks
  if (client.lastContact) {
    const daysSinceContact = Math.floor((new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24));
    if (daysSinceContact > 21) {
      risks.push({
        type: 'communication',
        severity: 'high',
        description: `No contact for ${daysSinceContact} days`,
        impact: -15,
        recommendation: 'Immediate outreach required to re-engage client'
      });
    } else if (daysSinceContact > 14) {
      risks.push({
        type: 'communication',
        severity: 'medium',
        description: `Limited recent contact (${daysSinceContact} days)`,
        impact: -8,
        recommendation: 'Schedule follow-up call to maintain momentum'
      });
    }
  }
  
  // Pattern-based risks from notes
  Object.entries(ENHANCED_RISK_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      if (pattern.test(notes)) {
        const severity = category === 'budget' || category === 'authority' ? 'high' : 'medium';
        const impact = severity === 'high' ? -12 : -6;
        
        risks.push({
          type: category,
          severity,
          description: `${category.charAt(0).toUpperCase() + category.slice(1)} concerns detected`,
          impact,
          recommendation: getRiskRecommendation(category)
        });
      }
    });
  });
  
  // Low engagement risk
  const engagementLevel = calculateEngagementLevel(client, notesData);
  if (engagementLevel === 'low') {
    risks.push({
      type: 'engagement',
      severity: 'medium',
      description: 'Low client engagement detected',
      impact: -10,
      recommendation: 'Implement re-engagement strategy with value-focused messaging'
    });
  }
  
  return risks.slice(0, 5); // Limit to top 5 risks
}

/**
 * Calculate confidence score based on data quality
 * @param {Object} client - Client object
 * @param {Object} notesData - Analyzed notes data
 * @param {number} riskCount - Number of identified risks
 * @return {number} - Confidence score (0-100)
 */
function calculateConfidenceScore(client, notesData, riskCount) {
  let confidence = 50; // Base confidence
  
  // Data quality factors
  if (client.notes && client.notes.length > 200) confidence += 15;
  else if (client.notes && client.notes.length > 100) confidence += 10;
  else if (client.notes && client.notes.length > 50) confidence += 5;
  
  if (client.lastContact) confidence += 10;
  if (client.deals && client.deals.length > 0) confidence += 10;
  
  // Notes analysis quality
  if (notesData.questions && notesData.questions.length > 0) confidence += 8;
  if (notesData.requirements && notesData.requirements.length > 0) confidence += 7;
  
  // Risk factor impact on confidence
  confidence -= Math.min(riskCount * 5, 20); // Max 20 point penalty
  
  return Math.max(INTELLIGENCE_CONFIG.confidence.minimumConfidence, Math.min(100, confidence));
}

/**
 * Calculate stage progress information
 * @param {string} currentStage - Current deal stage
 * @param {Object} stageMapping - Stage mapping configuration
 * @return {Object} - Stage progress information
 */
function calculateStageProgress(currentStage, stageMapping) {
  const stages = stageMapping.stages;
  const currentIndex = stages.indexOf(currentStage);
  
  if (currentIndex === -1) {
    return {
      currentIndex: 0,
      totalStages: stages.length,
      progressPercentage: 0,
      completedStages: [],
      remainingStages: stages
    };
  }
  
  const progressPercentage = Math.round((currentIndex / (stages.length - 1)) * 100);
  
  return {
    currentIndex,
    totalStages: stages.length,
    progressPercentage,
    completedStages: stages.slice(0, currentIndex),
    remainingStages: stages.slice(currentIndex + 1)
  };
}

/**
 * Get momentum description text
 * @param {string} momentum - Momentum category
 * @param {number} score - Momentum score
 * @return {string} - Human-readable description
 */
function getMomentumDescription(momentum, score) {
  const descriptions = {
    accelerating: 'Deal is progressing well with strong positive signals',
    steady: 'Deal is moving forward at a normal pace',
    stalling: 'Deal progress has slowed and needs attention',
    declining: 'Deal is at risk with multiple negative indicators'
  };
  
  return descriptions[momentum] || 'Deal momentum is unclear';
}

/**
 * Get recommendation for specific risk type
 * @param {string} riskType - Type of risk
 * @return {string} - Specific recommendation
 */
function getRiskRecommendation(riskType) {
  const recommendations = {
    budget: 'Prepare ROI analysis and flexible pricing options',
    timeline: 'Create urgency with limited-time incentives or deadlines',
    competition: 'Highlight unique differentiators and competitive advantages',
    authority: 'Identify and engage decision makers directly',
    engagement: 'Schedule value-focused discovery session to re-engage'
  };
  
  return recommendations[riskType] || 'Address concerns through direct communication';
}
// Part 3: Enhanced AI Intelligence and GPT Integration

/**
 * Generate enhanced deal intelligence with smart analysis
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
  const startTime = Date.now();

  try {
    console.log(`🔍 Generating enhanced deal intelligence for client ID: ${clientId}, user ID: ${userId}`);
    
    // Fetch client data
    const client = await Client.findOne({ _id: clientId, userId });
    if (!client) {
      console.log(`❌ No client found with ID: ${clientId}`);
      return false;
    }

    // Check if client has deals
    if (!client.deals || client.deals.length === 0) {
      console.log(`ℹ️ Client ${client.name || client.company || clientId} has no deals. Storing message.`);
      await storeNoDealsMessage(clientId, userId, client.company || client.name || "Unknown");
      return true;
    }

    // Filter only active deals
    const activeDeals = client.deals.filter(deal => ACTIVE_DEAL_STATUSES.includes(deal.status));
    
    if (activeDeals.length === 0) {
      console.log(`ℹ️ Client ${client.name || client.company || clientId} has no active deals. Storing message.`);
      await storeClosedDealsMessage(clientId, userId, client.company || client.name || "Unknown");
      return true;
    }

    // Get existing research data
    const existingResearch = await Research.findOne({ clientId, userId });
    
    // Get the most advanced deal (primary deal)
    const stageMapping = DEAL_STAGE_MAPPING[salesMethodology] || DEAL_STAGE_MAPPING.default;
    const primaryDeal = getHighestPriorityDeal(activeDeals, stageMapping.stagePriorities);
    
    // Enhanced deal preparation with time tracking
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
      googleData = existingResearch.data.google || [];
      pdlData = existingResearch.data.pdl || null;
      redditData = existingResearch.data.reddit || [];
    }

    // Enhanced notes analysis
    const notesData = analyzeClientNotes(client.notes || '');
    
    // Calculate enhanced deal score with intelligence
    const scoringResults = calculateEnhancedDealScore(primaryDeal, client, notesData, salesMethodology);
    
    // Determine industry for industry-specific recommendations
    let industry = 'default';
    if (pdlData && pdlData.companyData && pdlData.companyData.industry) {
      industry = pdlData.companyData.industry.toLowerCase();
    }
    
    // Generate enhanced deal intelligence using GPT with smart context
    const dealIntelligence = await callEnhancedGPTForDealIntelligence(
      client, 
      primaryDeal, 
      googleData, 
      pdlData,
      redditData,
      notesData,
      industry,
      stageMapping,
      scoringResults
    );
    
    // Store enhanced intelligence in research collection
    const updateResult = await storeDealIntelligence(clientId, userId, client.company || client.name || "Unknown", dealIntelligence);
    
    // Track performance metrics
    const processingTime = Date.now() - startTime;
    performanceMetrics.processingTimes.push(processingTime);
    performanceMetrics.totalProcessed++;
    
    console.log(`✅ Enhanced deal intelligence generated and stored for client ${clientId} (${processingTime}ms)`);
    console.log(`🎯 Deal Score: ${dealIntelligence.dealScore}% | Confidence: ${dealIntelligence.confidence}% | Momentum: ${dealIntelligence.momentum}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error generating enhanced deal intelligence for client ${clientId}:`, error.message);
    return false;
  } finally {
    runningProcesses.delete(processKey);
  }
}

/**
 * Enhanced GPT call with intelligent context and smart prompting
 * @param {Object} client - Client data
 * @param {Object} deal - Deal data
 * @param {Array} googleData - Google research data
 * @param {Object} pdlData - PDL company data
 * @param {Array} redditData - Reddit discussion data
 * @param {Object} notesData - Structured data from client notes
 * @param {string} industry - Client industry
 * @param {Object} stageMapping - Deal stage mapping
 * @param {Object} scoringResults - Enhanced scoring results
 * @return {Promise<Object>} - Enhanced deal intelligence data
 */
async function callEnhancedGPTForDealIntelligence(
  client, 
  deal, 
  googleData = [], 
  pdlData = null,
  redditData = [],
  notesData = {},
  industry = 'default',
  stageMapping = DEAL_STAGE_MAPPING.default,
  scoringResults = {}
) {
  try {
    console.log("🧠 Generating enhanced GPT-based deal intelligence with smart context...");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Get industry-specific strategy
    const industryStrategy = getIndustryStrategy(industry);
    
    // Build enhanced dynamic prompt with intelligence context
    const prompt = buildEnhancedIntelligentPrompt({
      client,
      deal,
      googleData,
      pdlData,
      redditData,
      notesData,
      industryStrategy,
      stageMapping,
      scoringResults
    });

    console.log(`📝 Enhanced prompt generated (${prompt.length} characters) with intelligence context`);

    // Call GPT-4 API with enhanced parameters
    const response = await axios.post(OPENAI_API_URL, {
      messages: [{ role: "system", content: prompt }],
      max_tokens: config.gpt_settings?.max_completion_tokens || 1000,
      temperature: config.gpt_settings?.temperature || 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1
    }, {
      headers: {
        "Content-Type": "application/json",
        "api-key": OPENAI_API_KEY
      },
      timeout: 30000 // 30 second timeout
    });

    // Extract and process response
    const responseContent = response.data.choices[0].message.content;
    
    try {
      // Enhanced JSON parsing with multiple strategies
      const dealIntelligence = parseEnhancedGPTResponse(responseContent);
      
      // Integrate with calculated scores and add metadata
      dealIntelligence.dealScore = scoringResults.score || dealIntelligence.dealScore;
      dealIntelligence.confidence = scoringResults.confidence || dealIntelligence.confidence;
      dealIntelligence.momentum = scoringResults.momentum?.momentum || dealIntelligence.momentum;
      dealIntelligence.riskFactors = scoringResults.riskFactors || [];
      dealIntelligence.engagementLevel = scoringResults.engagement || 'medium';
      
      // Add enhanced metadata
      dealIntelligence.generatedAt = new Date().toISOString();
      dealIntelligence.dataQuality = calculateDataQuality(client, googleData, pdlData, notesData);
      dealIntelligence.processingVersion = '2.0'; // Enhanced version identifier
      dealIntelligence.benchmarkData = scoringResults.benchmark || {};
      dealIntelligence.momentumSignals = scoringResults.momentum?.signals || [];
      
      console.log("✅ Successfully generated and integrated enhanced deal intelligence");
      console.log(`🎯 Final Score: ${dealIntelligence.dealScore}% | Momentum: ${dealIntelligence.momentum} | Risks: ${dealIntelligence.riskFactors.length}`);
      
      return dealIntelligence;
    } catch (parseError) {
      console.error("❌ Error parsing enhanced JSON response:", parseError.message);
      return createEnhancedFallbackIntelligence(deal, client, industry, stageMapping, scoringResults);
    }
  } catch (error) {
    console.error("❌ Error calling enhanced GPT for deal intelligence:", error.message);
    return createEnhancedFallbackIntelligence(deal, client, industry, stageMapping, scoringResults);
  }
}

/**
 * Build enhanced intelligent prompt with smart context
 * @param {Object} data - All available data for analysis
 * @return {string} - Enhanced constructed prompt
 */
function buildEnhancedIntelligentPrompt(data) {
  const {
    client,
    deal,
    googleData,
    pdlData,
    redditData,
    notesData,
    industryStrategy,
    stageMapping,
    scoringResults
  } = data;
  
  // Extract enhanced client information
  const clientName = client.name || "Unknown";
  const companyName = client.company || "Unknown";
  const position = client.position || "Unknown";
  const notes = client.notes || "No client notes available";
  const lastContact = client.lastContact 
    ? new Date(client.lastContact).toLocaleDateString() 
    : "Never contacted";
  
  // Enhanced deal information
  const dealTitle = deal.title || "Unnamed Deal";
  const dealStage = deal.status || "Unknown";
  const dealValue = deal.value ? `$${deal.value.toLocaleString()}` : "Not specified";
  const expectedCloseDate = deal.expectedCloseDate 
    ? new Date(deal.expectedCloseDate).toLocaleDateString() 
    : "No close date specified";
  const daysInStage = deal.daysInStage ? `${deal.daysInStage} days` : "Unknown";
  
  // Intelligence context from scoring
  const calculatedScore = scoringResults.score || 50;
  const momentum = scoringResults.momentum?.momentum || 'steady';
  const momentumSignals = scoringResults.momentum?.signals || [];
  const riskFactors = scoringResults.riskFactors || [];
  const engagementLevel = scoringResults.engagement || 'medium';
  const confidence = scoringResults.confidence || 50;
  
  // Smart context sections
  let intelligenceContext = `
INTELLIGENT ANALYSIS CONTEXT:
- Calculated Deal Score: ${calculatedScore}% (based on stage, momentum, engagement, risks)
- Current Momentum: ${momentum} (${scoringResults.momentum?.description || 'steady progress'})
- Client Engagement: ${engagementLevel} level
- Analysis Confidence: ${confidence}%`;

  if (momentumSignals.length > 0) {
    intelligenceContext += `
- Key Signals Detected:
${momentumSignals.map(signal => `  * ${signal.type}: ${signal.signal}`).join('\n')}`;
  }

  if (riskFactors.length > 0) {
    intelligenceContext += `
- Risk Factors Identified:
${riskFactors.map(risk => `  * ${risk.severity} ${risk.type}: ${risk.description}`).join('\n')}`;
  }
  
  // Enhanced company information
  let companyInfoSection = "";
  if (pdlData && pdlData.companyData) {
    const companyData = pdlData.companyData;
    companyInfoSection = `
COMPANY INTELLIGENCE:
- Industry: ${companyData.industry || 'Unknown'}
- Company Size: ${companyData.size || companyData.employee_count || 'Unknown'} employees
- Location: ${companyData.location?.locality || ''}, ${companyData.location?.region || ''}
- Type: ${companyData.type || 'Unknown'}`;
  }
  
  // Smart recent news section
  let recentNewsSection = "";
  if (googleData && googleData.length > 0) {
    recentNewsSection = `
RECENT MARKET INTELLIGENCE:
${googleData.slice(0, 3).map(item => 
  `- ${item.title || 'Untitled'} (${item.source || 'Unknown source'})`
).join('\n')}`;
  }
  
  // Enhanced notes insights
  let clientNotesInsightsSection = "";
  if (notesData && Object.keys(notesData).length > 0) {
    const hasQuestions = notesData.questions && notesData.questions.length > 0;
    const hasRequirements = notesData.requirements && notesData.requirements.length > 0;
    const hasDecisionPoints = notesData.decisionPoints && notesData.decisionPoints.length > 0;
    
    if (hasQuestions || hasRequirements || hasDecisionPoints) {
      clientNotesInsightsSection = `
CLIENT ENGAGEMENT ANALYSIS:
${hasQuestions ? `Questions Asked (${notesData.questions.length}):\n${notesData.questions.slice(0, 3).map(q => `- ${q}`).join('\n')}` : ''}
${hasRequirements ? `Requirements Identified (${notesData.requirements.length}):\n${notesData.requirements.slice(0, 3).map(r => `- ${r}`).join('\n')}` : ''}
${hasDecisionPoints ? `Decision Points:\n${notesData.decisionPoints.slice(0, 2).map(d => `- ${d}`).join('\n')}` : ''}`;
    }
  }
  
  // Enhanced industry section with smart recommendations
  const industrySection = `
INDUSTRY-SPECIFIC INTELLIGENCE:
- Primary Focus Areas: ${industryStrategy.topics.slice(0, 3).join(', ')}
- Common Objections to Address: ${industryStrategy.objections.slice(0, 3).join(', ')}
- Key Technical Terms: ${industryStrategy.technicalTerms.slice(0, 3).join(', ')}`;
  
  // Stage progression context
  const stageInfo = DEAL_STAGES[dealStage] || {};
  const stageContext = stageInfo.focusAreas 
    ? `\n- Stage Focus: ${stageInfo.focusAreas.join(', ')}`
    : "";
  
  // Build the enhanced intelligent prompt
  return `
You are an expert AI sales intelligence analyst with deep expertise in ${industryStrategy.topics[0] || 'business'} sales and deal progression analysis.

MISSION: Analyze this sales opportunity using advanced intelligence algorithms and provide actionable deal intelligence with specific, time-bound recommendations.

CLIENT & DEAL OVERVIEW:
- Contact: ${clientName} (${position}) at ${companyName}
- Last Communication: ${lastContact}
- Deal: "${dealTitle}" - ${dealValue} - Stage: ${dealStage}
- Expected Close: ${expectedCloseDate}
- Time in Current Stage: ${daysInStage}${stageContext}

${intelligenceContext}
${companyInfoSection}
${recentNewsSection}
${clientNotesInsightsSection}
${industrySection}

CLIENT COMMUNICATION HISTORY:
${notes}

ADVANCED ANALYSIS INSTRUCTIONS:
1. Use the calculated deal score (${calculatedScore}%) as your baseline, but provide your own nuanced assessment
2. Factor in the detected momentum (${momentum}) and engagement level (${engagementLevel})
3. Address each identified risk factor with specific mitigation strategies
4. Provide time-specific recommendations with clear deadlines
5. Consider industry benchmarks and typical deal patterns for ${industryStrategy.topics[0] || 'this industry'}

OUTPUT FORMAT: Return a comprehensive JSON analysis with these exact fields:

{
  "dealScore": ${calculatedScore},
  "reasoning": "Detailed explanation of score with specific factors",
  "confidence": ${confidence},
  "momentum": "${momentum}",
  "currentStage": "${dealStage}",
  "stageData": {
    "currentStage": "${dealStage}",
    "timeInStage": "${daysInStage}",
    "isOverdue": ${deal.daysInStage > 30 ? 'true' : 'false'},
    "nextStageProbability": null,
    "estimatedDaysToNextStage": null
  },
  "keyInsights": [
    {"insight": "", "impact": "high|medium|low", "actionRequired": true|false}
  ],
  "riskFactors": [
    {"risk": "", "severity": "high|medium|low", "mitigation": "", "timeline": ""}
  ],
  "opportunities": [
    {"opportunity": "", "potential": "high|medium|low", "action": "", "timeline": ""}
  ],
  "nextActions": [
    {"action": "", "priority": "high|medium|low", "deadline": "", "expectedOutcome": ""}
  ],
  "conversationStarters": [
    {"topic": "", "question": "", "purpose": ""}
  ],
  "industryBenchmark": {
    "typicalStageLength": "${stageMapping.typicalDuration[dealStage] || 30} days",
    "successProbability": "${stageMapping.successProbability[dealStage] || 50}%",
    "comparison": "above|at|below average"
  }
}

CRITICAL: Return ONLY valid JSON. No markdown, no additional text, no explanations outside the JSON structure.
Base your analysis on the specific data provided and avoid generic responses. Make recommendations actionable with specific timelines.`;
}

/**
 * Enhanced JSON response parser with multiple parsing strategies
 * @param {string} responseContent - GPT response content
 * @return {Object} - Parsed deal intelligence
 */
function parseEnhancedGPTResponse(responseContent) {
  // Strategy 1: Direct JSON parsing
  try {
    return JSON.parse(responseContent.trim());
  } catch (e) {
    // Continue to next strategy
  }
  
  // Strategy 2: Extract from markdown code block
  try {
    const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
  } catch (e) {
    // Continue to next strategy
  }
  
  // Strategy 3: Find JSON-like structure with flexible regex
  try {
    const jsonRegex = /{[\s\S]*}/;
    const possibleJson = responseContent.match(jsonRegex);
    if (possibleJson) {
      return JSON.parse(possibleJson[0]);
    }
  } catch (e) {
    // Continue to next strategy
  }
  
  // Strategy 4: Clean and retry
  try {
    const cleaned = responseContent
      .replace(/^\s*```\s*json\s*/, '')
      .replace(/\s*```\s*$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // If all strategies fail, throw error
    throw new Error('Unable to parse JSON response with any strategy');
  }
}
// DealSummary.js - Part 4: Enhanced Intelligence Storage and Utility Functions

/**
 * Calculate data quality score for confidence assessment
 * @param {Object} client - Client data
 * @param {Array} googleData - Google research data
 * @param {Object} pdlData - PDL company data
 * @param {Object} notesData - Analyzed notes data
 * @return {number} - Data quality score (0-100)
 */
function calculateDataQuality(client, googleData = [], pdlData = null, notesData = {}) {
  let qualityScore = 0;
  
  // Client data quality (40% weight)
  if (client.notes && client.notes.length > 200) qualityScore += 20;
  else if (client.notes && client.notes.length > 100) qualityScore += 15;
  else if (client.notes && client.notes.length > 50) qualityScore += 10;
  
  if (client.lastContact) qualityScore += 10;
  if (client.deals && client.deals.length > 0) qualityScore += 10;
  
  // External research quality (30% weight)
  if (pdlData && pdlData.companyData) qualityScore += 15;
  if (googleData && googleData.length > 0) qualityScore += 10;
  if (googleData && googleData.length >= 3) qualityScore += 5;
  
  // Notes analysis quality (30% weight)
  if (notesData.questions && notesData.questions.length > 0) qualityScore += 10;
  if (notesData.requirements && notesData.requirements.length > 0) qualityScore += 10;
  if (notesData.decisionPoints && notesData.decisionPoints.length > 0) qualityScore += 10;
  
  return Math.min(100, qualityScore);
}

/**
 * Get industry-specific strategy configuration
 * @param {string} industry - Industry identifier
 * @return {Object} - Industry strategy configuration
 */
function getIndustryStrategy(industry) {
  const normalizedIndustry = industry.toLowerCase();
  
  // Direct match
  if (INDUSTRY_SALES_STRATEGIES[normalizedIndustry]) {
    return INDUSTRY_SALES_STRATEGIES[normalizedIndustry];
  }
  
  // Partial match
  for (const [key, strategy] of Object.entries(INDUSTRY_SALES_STRATEGIES)) {
    if (normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) {
      return strategy;
    }
  }
  
  // Default fallback
  return INDUSTRY_SALES_STRATEGIES.default;
}

/**
 * Get highest priority deal from multiple deals
 * @param {Array} deals - Array of deal objects
 * @param {Object} stagePriorities - Stage priority mapping
 * @return {Object} - Highest priority deal
 */
function getHighestPriorityDeal(deals, stagePriorities) {
  if (!deals || deals.length === 0) return null;
  if (deals.length === 1) return deals[0];
  
  return deals.reduce((highestPriorityDeal, currentDeal) => {
    const currentPriority = stagePriorities[currentDeal.status] || 0;
    const highestPriority = stagePriorities[highestPriorityDeal.status] || 0;
    
    if (currentPriority > highestPriority) {
      return currentDeal;
    } else if (currentPriority === highestPriority) {
      // If same priority, choose the one with higher value
      return (currentDeal.value || 0) > (highestPriorityDeal.value || 0) 
        ? currentDeal 
        : highestPriorityDeal;
    }
    
    return highestPriorityDeal;
  });
}

/**
 * Enhanced client notes analysis with pattern detection
 * @param {string} notes - Client notes text
 * @return {Object} - Structured analysis of notes
 */
function analyzeClientNotes(notes) {
  if (!notes || typeof notes !== 'string') {
    return {
      questions: [],
      requirements: [],
      decisionPoints: [],
      upcomingEvents: [],
      sentiment: 'neutral',
      keyTopics: [],
      urgencyIndicators: []
    };
  }
  
  // Split notes into sentences for analysis
  const sentences = notes
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  // Extract questions (enhanced pattern matching)
  const questions = sentences.filter(sentence => 
    NOTE_PATTERNS.questions.some(pattern => pattern.test(sentence)) ||
    sentence.includes('?') ||
    /^(how|what|when|where|why|who|can|will|would|could|should|is|are|do|does)/i.test(sentence.trim())
  );
  
  // Extract requirements (enhanced pattern matching)
  const requirements = sentences.filter(sentence =>
    NOTE_PATTERNS.requirements.some(pattern => pattern.test(sentence)) &&
    !NOTE_PATTERNS.questions.some(pattern => pattern.test(sentence))
  );
  
  // Extract decision points
  const decisionPoints = extractDecisionPoints(notes);
  
  // Extract upcoming events
  const upcomingEvents = extractUpcomingEvents(notes);
  
  // Analyze sentiment
  const sentiment = analyzeSentiment(notes);
  
  // Extract key topics (simple keyword extraction)
  const keyTopics = extractKeyTopics(notes);
  
  // Detect urgency indicators
  const urgencyIndicators = detectUrgencyIndicators(notes);
  
  return {
    questions: questions.slice(0, 10), // Limit to top 10
    requirements: requirements.slice(0, 8), // Limit to top 8
    decisionPoints: decisionPoints.slice(0, 5),
    upcomingEvents: upcomingEvents.slice(0, 3),
    sentiment,
    keyTopics: keyTopics.slice(0, 5),
    urgencyIndicators
  };
}

/**
 * Simple sentiment analysis
 * @param {string} text - Text to analyze
 * @return {string} - Sentiment (positive/negative/neutral)
 */
function analyzeSentiment(text) {
  const positiveWords = [
    'excited', 'interested', 'great', 'perfect', 'excellent', 'love', 'amazing',
    'fantastic', 'wonderful', 'approve', 'impressed', 'satisfied', 'happy',
    'pleased', 'optimistic', 'confident', 'enthusiastic'
  ];
  
  const negativeWords = [
    'concerned', 'worried', 'problem', 'issue', 'difficult', 'expensive',
    'complicated', 'disappointed', 'frustrated', 'doubt', 'hesitant',
    'uncertain', 'risky', 'challenging', 'obstacles'
  ];
  
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Extract key topics from text
 * @param {string} text - Text to analyze
 * @return {Array} - Array of key topics
 */
function extractKeyTopics(text) {
  const keyTerms = [
    'integration', 'api', 'security', 'compliance', 'budget', 'timeline',
    'implementation', 'training', 'support', 'pricing', 'contract',
    'approval', 'decision', 'evaluation', 'demo', 'pilot', 'rollout'
  ];
  
  const lowerText = text.toLowerCase();
  
  return keyTerms.filter(term => lowerText.includes(term));
}

/**
 * Detect urgency indicators in text
 * @param {string} text - Text to analyze
 * @return {Array} - Array of urgency indicators
 */
function detectUrgencyIndicators(text) {
  const urgencyPatterns = [
    /urgent/i, /asap/i, /immediately/i, /rush/i, /priority/i,
    /deadline/i, /end of \w+/i, /by \w+ \d+/i, /needs? to be done/i,
    /time sensitive/i, /critical/i, /emergency/i
  ];
  
  const indicators = [];
  
  urgencyPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      indicators.push(matches[0]);
    }
  });
  
  return [...new Set(indicators)]; // Remove duplicates
}

/**
 * Create enhanced fallback intelligence when GPT fails
 * @param {Object} deal - Deal object  
 * @param {Object} client - Client object
 * @param {string} industry - Industry
 * @param {Object} stageMapping - Stage mapping
 * @param {Object} scoringResults - Scoring results
 * @return {Object} - Fallback intelligence
 */
function createEnhancedFallbackIntelligence(deal, client, industry, stageMapping, scoringResults) {
  const dealStage = deal.status || 'prospecting';
  const industryStrategy = getIndustryStrategy(industry);
  const notesData = analyzeClientNotes(client.notes || '');
  
  return {
    dealScore: scoringResults.score || 50,
    reasoning: `Calculated score based on ${dealStage} stage, ${scoringResults.momentum?.momentum || 'steady'} momentum, and ${scoringResults.engagement || 'medium'} engagement level.`,
    confidence: scoringResults.confidence || 60,
    momentum: scoringResults.momentum?.momentum || 'steady',
    currentStage: dealStage,
    stageData: {
      currentStage: dealStage,
      timeInStage: `${deal.daysInStage || 0} days`,
      isOverdue: (deal.daysInStage || 0) > (stageMapping.typicalDuration[dealStage] || 30),
      nextStageProbability: null,
      estimatedDaysToNextStage: null
    },
    keyInsights: [
      {
        insight: `Deal is in ${dealStage} stage with ${scoringResults.momentum?.momentum || 'steady'} momentum`,
        impact: "medium",
        actionRequired: scoringResults.riskFactors?.length > 0
      }
    ],
    riskFactors: (scoringResults.riskFactors || []).map(risk => ({
      risk: risk.description,
      severity: risk.severity,
      mitigation: risk.recommendation,
      timeline: "Within 1 week"
    })),
    opportunities: [
      {
        opportunity: `Address ${industryStrategy.topics[0] || 'key requirements'} to advance deal`,
        potential: "medium",
        action: `Focus conversation on ${industryStrategy.topics[0] || 'client needs'}`,
        timeline: "Next meeting"
      }
    ],
    nextActions: [
      {
        action: "Schedule follow-up call to address client questions",
        priority: "high",
        deadline: "Within 3 days",
        expectedOutcome: "Maintain momentum and address concerns"
      }
    ],
    conversationStarters: [
      {
        topic: industryStrategy.topics[0] || "Implementation",
        question: `How are you currently handling ${industryStrategy.topics[0]?.toLowerCase() || 'this process'}?`,
        purpose: "Understand current state and identify pain points"
      }
    ],
    industryBenchmark: {
      typicalStageLength: `${stageMapping.typicalDuration[dealStage] || 30} days`,
      successProbability: `${stageMapping.successProbability[dealStage] || 50}%`,
      comparison: (deal.daysInStage || 0) > (stageMapping.typicalDuration[dealStage] || 30) 
        ? "above average" 
        : "at average"
    },
    generatedAt: new Date().toISOString(),
    dataQuality: calculateDataQuality(client, [], null, notesData),
    processingVersion: '2.0-fallback',
    riskFactors: scoringResults.riskFactors || [],
    engagementLevel: scoringResults.engagement || 'medium',
    momentumSignals: scoringResults.momentum?.signals || []
  };
}

/**
 * Store enhanced deal intelligence in database
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @param {string} companyName - Company name
 * @param {Object} intelligence - Generated intelligence
 * @return {Promise<boolean>} - Success status
 */
async function storeDealIntelligence(clientId, userId, companyName, intelligence) {
  try {
    const now = new Date();
    
    const updateResult = await Research.updateOne(
      { clientId, userId },
      {
        $set: {
          "dealIntelligence": intelligence,
          "lastDealAnalysis": now,
          "companyName": companyName,
          "company": companyName,
          "lastUpdatedDeals": now
        },
        $setOnInsert: {
          clientId,
          userId,
          timestamp: now
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Enhanced deal intelligence stored for ${companyName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error storing enhanced deal intelligence:`, error.message);
    return false;
  }
}

/**
 * Store message for clients with no deals
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @param {string} companyName - Company name
 * @return {Promise<boolean>} - Success status
 */
async function storeNoDealsMessage(clientId, userId, companyName) {
  try {
    const message = {
      dealScore: null,
      reasoning: "No active deals found for this client.",
      confidence: null,
      momentum: null,
      currentStage: null,
      message: "This client currently has no active deals. Consider creating a new opportunity or following up on their needs.",
      suggestion: "Review client notes and recent interactions to identify potential opportunities.",
      nextActions: [
        {
          action: "Review client interaction history",
          priority: "medium",
          deadline: "Within 1 week",
          expectedOutcome: "Identify potential opportunities"
        },
        {
          action: "Schedule discovery call",
          priority: "medium", 
          deadline: "Within 2 weeks",
          expectedOutcome: "Uncover new business needs"
        }
      ],
      generatedAt: new Date().toISOString(),
      processingVersion: '2.0-no-deals'
    };
    
    await Research.updateOne(
      { clientId, userId },
      {
        $set: {
          "dealIntelligence": message,
          "lastDealAnalysis": new Date(),
          "companyName": companyName,
          "company": companyName
        },
        $setOnInsert: {
          clientId,
          userId,
          timestamp: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ No deals message stored for ${companyName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error storing no deals message:`, error.message);
    return false;
  }
}

/**
 * Store message for clients with only closed deals
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID  
 * @param {string} companyName - Company name
 * @return {Promise<boolean>} - Success status
 */
async function storeClosedDealsMessage(clientId, userId, companyName) {
  try {
    const message = {
      dealScore: null,
      reasoning: "All deals with this client are closed (won or lost).",
      confidence: null,
      momentum: null,
      currentStage: null,
      message: "This client has completed deals but no active opportunities. Consider expansion or follow-up opportunities.",
      suggestion: "Analyze closed deals to identify expansion opportunities or learn from lost deals.",
      nextActions: [
        {
          action: "Review closed deal outcomes",
          priority: "low",
          deadline: "Within 2 weeks",
          expectedOutcome: "Identify lessons learned and expansion opportunities"
        },
        {
          action: "Explore upsell/cross-sell opportunities",
          priority: "medium",
          deadline: "Within 1 month",
          expectedOutcome: "Identify new revenue potential"
        }
      ],
      generatedAt: new Date().toISOString(),
      processingVersion: '2.0-closed-deals'
    };
    
    await Research.updateOne(
      { clientId, userId },
      {
        $set: {
          "dealIntelligence": message,
          "lastDealAnalysis": new Date(),
          "companyName": companyName,
          "company": companyName
        },
        $setOnInsert: {
          clientId,
          userId,
          timestamp: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Closed deals message stored for ${companyName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error storing closed deals message:`, error.message);
    return false;
  }
}

/**
 * Get performance metrics for monitoring
 * @return {Object} - Performance metrics
 */
function getPerformanceMetrics() {
  const avgProcessingTime = performanceMetrics.processingTimes.length > 0
    ? performanceMetrics.processingTimes.reduce((a, b) => a + b, 0) / performanceMetrics.processingTimes.length
    : 0;
    
  return {
    totalProcessed: performanceMetrics.totalProcessed,
    averageProcessingTime: Math.round(avgProcessingTime),
    successRate: performanceMetrics.successRate,
    currentlyRunning: runningProcesses.size
  };
}

/**
 * Clean up old processing metrics (call periodically)
 */
function cleanupMetrics() {
  // Keep only last 100 processing times
  if (performanceMetrics.processingTimes.length > 100) {
    performanceMetrics.processingTimes = performanceMetrics.processingTimes.slice(-100);
  }
}

/**
 * Batch process multiple clients for deal intelligence
 * @param {Array} clientIds - Array of client IDs
 * @param {string} userId - User ID
 * @param {string} salesMethodology - Sales methodology
 * @return {Promise<Object>} - Batch processing results
 */
async function batchGenerateDealIntelligence(clientIds, userId, salesMethodology = 'default') {
  const results = {
    processed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  console.log(`🔄 Starting batch processing for ${clientIds.length} clients...`);
  
  for (const clientId of clientIds) {
    try {
      // Add small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const success = await generateDealIntelligence(clientId, userId, salesMethodology);
      
      if (success) {
        results.processed++;
        results.details.push({ clientId, status: 'success' });
      } else {
        results.skipped++;
        results.details.push({ clientId, status: 'skipped' });
      }
    } catch (error) {
      results.failed++;
      results.details.push({ 
        clientId, 
        status: 'failed', 
        error: error.message 
      });
      console.error(`❌ Batch processing failed for client ${clientId}:`, error.message);
    }
  }
  
  console.log(`✅ Batch processing completed: ${results.processed} processed, ${results.failed} failed, ${results.skipped} skipped`);
  return results;
}

/**
 * Process deal intelligence for all active clients
 * @param {number} batchSize - Number of clients to process in parallel (default: 5)
 * @param {string} salesMethodology - Sales methodology to use (default: 'default')
 * @return {Promise<Object>} - Processing results summary
 */
async function processAllClientDeals(batchSize = 5, salesMethodology = 'default') {
  try {
    console.log('🚀 Starting batch deal intelligence generation for all clients...');
    
    // Fetch all active clients with deals or notes
    const clients = await Client.find({ 
      isActive: true,
      $or: [
        { 'deals.0': { $exists: true } }, // Has at least one deal
        { notes: { $exists: true, $ne: "" } } // Has notes
      ]
    }).lean();

    console.log(`📊 Found ${clients.length} active clients with deals or notes`);

    if (clients.length === 0) {
      console.log('⚠️ No active clients found with deals. Exiting...');
      return { processed: 0, failed: 0, skipped: 0, total: 0 };
    }

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      total: clients.length,
      details: [],
      startTime: new Date(),
      endTime: null
    };

    // Process clients in batches to avoid overwhelming the system
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clients.length / batchSize)} (${batch.length} clients)`);

      // Process batch in parallel
      const batchPromises = batch.map(async (clientData) => {
        try {
          const clientId = clientData._id.toString();
          const userId = clientData.userId;
          
          console.log(`  🔄 Processing ${clientData.name} (${clientData.company || 'No Company'})`);
          
          const success = await generateDealIntelligence(clientId, userId, salesMethodology);
          
          if (success) {
            console.log(`  ✅ Success: ${clientData.name}`);
            return { success: true, client: clientData.name, clientId };
          } else {
            console.log(`  ⚠️ Skipped: ${clientData.name}`);
            return { success: false, client: clientData.name, clientId, reason: 'skipped' };
          }
        } catch (error) {
          console.log(`  ❌ Failed: ${clientData.name} - ${error.message}`);
          return { success: false, client: clientData.name, clientId: clientData._id.toString(), error: error.message };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Update results
      batchResults.forEach(result => {
        if (result.success) {
          results.processed++;
        } else if (result.error) {
          results.failed++;
        } else {
          results.skipped++;
        }
        results.details.push(result);
      });

      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < clients.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    results.endTime = new Date();
    const durationMinutes = Math.round((results.endTime - results.startTime) / 1000 / 60);

    console.log(`\n✅ Batch processing completed in ${durationMinutes} minutes:`);
    console.log(`   📈 Processed: ${results.processed}`);
    console.log(`   ⚠️ Skipped: ${results.skipped}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📊 Total: ${results.total}`);

    return results;

  } catch (error) {
    console.error('❌ Error in batch processing:', error.message);
    throw error;
  }
}

// Export enhanced functions for use by other modules
module.exports = {
  generateDealIntelligence,
  processAllClientDeals,
  batchGenerateDealIntelligence,
  getPerformanceMetrics,
  cleanupMetrics,
  analyzeClientNotes,
  calculateEnhancedDealScore,
  INTELLIGENCE_CONFIG,
  DEAL_STAGE_MAPPING
};