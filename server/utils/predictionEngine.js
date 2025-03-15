// utils/predictionEngine.js

const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY
});

/**
* Generate a deal prediction using AI and all available data sources
* @param {Object} deal - Deal object
* @param {Object} client - Client object
* @param {Object} researchData - Combined research data from all sources
* @param {Array} interactions - Recent interactions (optional)
* @returns {Promise<Object>} Prediction object
*/
async function generateDealPrediction(deal, client, researchData = {}, interactions = []) {
 try {
   console.log(`🧠 Generating prediction for deal ${deal._id}`);
   
   // Create a comprehensive prompt with all available data
   const prompt = createPredictionPrompt(deal, client, researchData, interactions);
   
   // Call OpenAI API
   const response = await openai.chat.completions.create({
     model: "gpt-4o",
     messages: [
       { role: "system", content: "You are an expert B2B sales AI that predicts deal outcomes based on data." },
       { role: "user", content: prompt }
     ],
     temperature: 0.2,
     max_tokens: 1000,
     response_format: { type: "json_object" }
   });
   
   // Parse and validate the response
   const aiResponse = JSON.parse(response.choices[0].message.content);
   
   // Validate the response has required fields
   if (!aiResponse.probability || !aiResponse.factors) {
     throw new Error('AI response missing required fields');
   }
   
   // Create a prediction object
   const prediction = {
     predictedAt: new Date(),
     predictedCloseDate: aiResponse.predictedCloseDate ? new Date(aiResponse.predictedCloseDate) : null,
     probability: parseFloat(aiResponse.probability),
     predictedStage: aiResponse.nextStage || deal.status,
     actualOutcome: 'pending',
     factors: {
       positive: aiResponse.factors.positive || [],
       negative: aiResponse.factors.negative || []
     },
     timeToCloseEstimate: aiResponse.timeToCloseEstimate || null,
     confidenceScore: aiResponse.confidenceScore || 85,
     stageEstimates: aiResponse.stageEstimates || [],
     source: 'ai'
   };
   
   console.log(`✅ Generated prediction for deal ${deal._id} with probability ${prediction.probability}%`);
   
   return prediction;
 } catch (error) {
   console.error(`Error generating prediction: ${error.message}`);
   return null;
 }
}

/**
* Create a comprehensive prompt for the prediction model using all available data sources
* @param {Object} deal - Deal object
* @param {Object} client - Client object
* @param {Object} researchData - Combined research data
* @param {Array} interactions - Recent interactions
* @returns {string} Formatted prompt
*/
function createPredictionPrompt(deal, client, researchData, interactions) {
 // Format deal data
 let prompt = `# DEAL PREDICTION REQUEST

## Deal Information
- Title: ${deal.title}
- Value: $${deal.value?.toLocaleString() || '0'}
- Current Stage: ${deal.status}
- Created: ${formatDate(deal.createdAt)}
- Expected Close Date: ${formatDate(deal.expectedCloseDate)}
- Days in current stage: ${calculateDaysInStage(deal)}

## Client Information
- Name: ${client.name}
- Company: ${client.company || 'Unknown'}
- Position: ${client.position || 'Unknown'}
- Last Contact: ${formatDate(client.lastContact)}
`;

 // Add client notes if available
 if (client.notes) {
   prompt += `
## Client Notes
${client.notes}
`;
 }

 // Add stage history if available
 if (deal.stageHistory && deal.stageHistory.length > 0) {
   prompt += `
## Stage History
`;
   deal.stageHistory.forEach(stage => {
     const exitedAt = stage.exitedAt ? formatDate(stage.exitedAt) : 'Current';
     prompt += `- ${stage.stage}: ${formatDate(stage.enteredAt)} to ${exitedAt} (${stage.durationDays ? stage.durationDays.toFixed(1) : 'N/A'} days)\n`;
   });
 }

 // Dynamically add research data sections based on what's available
 // This approach makes it easy to incorporate new data sources in the future
 if (researchData) {
   // Add PDL data if available
   if (researchData.pdl) {
     prompt += addPDLDataToPrompt(researchData.pdl);
   }
   
   // Add Google News data if available
   if (researchData.google && Array.isArray(researchData.google) && researchData.google.length > 0) {
     prompt += addGoogleNewsToPrompt(researchData.google);
   }
   
   // Future data sources can be added here following the same pattern
   // Example:
   // if (researchData.linkedin) {
   //   prompt += addLinkedInDataToPrompt(researchData.linkedin);
   // }
 }

 // Add recent interactions if available
 if (interactions && interactions.length > 0) {
   prompt += `
## Recent Interactions
`;
   interactions.forEach(interaction => {
     prompt += `- ${formatDate(interaction.date)} (${interaction.type}): ${interaction.summary || 'No summary'} [Sentiment: ${interaction.sentiment}]\n`;
   });
 }

 // Add previous predictions if available
 if (deal.predictions && deal.predictions.length > 0) {
   const sortedPredictions = [...deal.predictions].sort((a, b) => 
     new Date(b.predictedAt) - new Date(a.predictedAt)
   );
   
   prompt += `
## Previous Predictions
`;
   
   sortedPredictions.slice(0, 3).forEach(prediction => {
     prompt += `- ${formatDate(prediction.predictedAt)}: ${prediction.probability}% probability (${prediction.predictedStage})\n`;
   });
 }

 // Add request for structured output
 prompt += `
Please analyze this deal and provide a prediction in JSON format with the following structure:
{
 "probability": 75, // Success probability as a number from 0-100
 "predictedCloseDate": "2023-12-15", // Estimated close date in YYYY-MM-DD format
 "nextStage": "negotiation", // Next predicted stage
 "timeToCloseEstimate": 45, // Estimated days to close
 "confidenceScore": 85, // Your confidence in this prediction (0-100)
 "factors": {
   "positive": ["Responsive client", "Budget confirmed", "Technical requirements clear"],
   "negative": ["Long sales cycle", "Multiple decision makers", "Competitor involvement"]
 },
 "stageEstimates": [
   {"stage": "negotiation", "estimatedDays": 14},
   {"stage": "closed_won", "estimatedDays": 30}
 ]
}

Focus on evidence-based factors, be realistic about timeframes, and provide specific actionable insights.`;

 return prompt;
}

/**
* Helper function to format PDL data for prompt
* @param {Object} pdlData - PDL research data
* @returns {string} Formatted PDL section
*/
function addPDLDataToPrompt(pdlData) {
 let section = "\n## Company Intelligence (PDL)\n";
 
 // Add company data if available
 if (pdlData.companyData) {
   const company = pdlData.companyData;
   
   section += `- Company Name: ${company.display_name || company.name || 'Unknown'}\n`;
   section += `- Size: ${company.size || 'Unknown'}\n`;
   
   if (company.industry) {
     section += `- Industry: ${company.industry}\n`;
   }
   
   if (company.location) {
     section += `- Location: ${company.location.name || 'Unknown'}\n`;
   }
   
   if (company.summary) {
     section += `- Company Description: ${company.summary.substring(0, 200)}...\n`;
   }
   
   if (company.employee_count) {
     section += `- Employees: ${company.employee_count.toLocaleString()}\n`;
   }
 }
 
 // Add person data if available
 if (pdlData.personData && pdlData.personData.data) {
   const person = pdlData.personData.data;
   
   section += "\n### Decision Maker Information\n";
   section += `- Name: ${person.full_name || 'Unknown'}\n`;
   section += `- Title: ${person.job_title || 'Unknown'}\n`;
   
   if (person.job_title_levels && person.job_title_levels.length > 0) {
     section += `- Level: ${person.job_title_levels.join(', ')}\n`;
   }
   
   if (person.skills && person.skills.length > 0) {
     section += `- Skills: ${person.skills.slice(0, 5).join(', ')}\n`;
   }
   
   if (person.experience && person.experience.length > 0) {
     section += "\n#### Work Experience\n";
     
     // Get up to 3 most recent experiences
     const recentExperiences = person.experience.slice(0, 3);
     
     recentExperiences.forEach(exp => {
       const company = exp.company?.name || 'Unknown Company';
       const title = exp.title?.name || 'Unknown Title';
       const startDate = exp.start_date || 'Unknown';
       const endDate = exp.end_date || 'Present';
       
       section += `- ${title} at ${company} (${startDate} to ${endDate})\n`;
     });
   }
 }
 
 return section;
}

/**
* Helper function to format Google News data for prompt
* @param {Array} googleNews - Google News articles
* @returns {string} Formatted Google News section
*/
function addGoogleNewsToPrompt(googleNews) {
 let section = "\n## Recent News\n";
 
 // Sort by published date (newest first)
 const sortedNews = [...googleNews].sort((a, b) => {
   const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
   const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
   return dateB - dateA;
 });
 
 // Include up to 5 most recent news items
 const recentNews = sortedNews.slice(0, 5);
 
 recentNews.forEach(article => {
   const date = article.publishedDate ? formatDate(article.publishedDate) : 'Unknown date';
   const source = article.source || 'Unknown source';
   const snippet = article.snippet && article.snippet !== 'No snippet available' 
     ? article.snippet.substring(0, 150) + '...'
     : 'No details available';
   
   section += `- **${article.title}** (${date}, ${source}): ${snippet}\n`;
 });
 
 return section;
}

/**
* Format a date for display in the prompt
* @param {Date} date - Date to format
* @returns {string} Formatted date string
*/
function formatDate(date) {
 if (!date) return 'Not set';
 
 let dateObj;
 try {
   dateObj = new Date(date);
   
   // Check if valid date
   if (isNaN(dateObj.getTime())) {
     return 'Invalid date';
   }
   
   return dateObj.toISOString().split('T')[0];
 } catch (e) {
   return 'Invalid date';
 }
}

/**
* Calculate days in current stage
* @param {Object} deal - Deal object
* @returns {number} Days in current stage
*/
function calculateDaysInStage(deal) {
 if (!deal.stageHistory || deal.stageHistory.length === 0) {
   return 0;
 }
 
 const currentStageEntry = deal.stageHistory.find(entry => 
   entry.stage === deal.status && !entry.exitedAt
 );
 
 if (!currentStageEntry) {
   return 0;
 }
 
 const enteredDate = new Date(currentStageEntry.enteredAt);
 const now = new Date();
 
 const diffTime = Math.abs(now - enteredDate);
 return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
* Calculate velocity metrics for a deal
* @param {Object} deal - Deal object
* @returns {Object} Velocity metrics
*/
function calculateVelocityMetrics(deal) {
 if (!deal.stageHistory || deal.stageHistory.length < 2) {
   return {
     averageDaysPerStage: null,
     totalDaysActive: calculateDaysActive(deal),
     stageProgressionRate: null,
     velocityTrend: 'insufficient_data'
   };
 }
 
 // Get completed stages with duration data
 const completedStages = deal.stageHistory.filter(stage => stage.exitedAt && stage.durationDays);
 
 if (completedStages.length === 0) {
   return {
     averageDaysPerStage: null,
     totalDaysActive: calculateDaysActive(deal),
     stageProgressionRate: null,
     velocityTrend: 'insufficient_data'
   };
 }
 
 // Calculate average days per stage
 const totalDays = completedStages.reduce((sum, stage) => sum + stage.durationDays, 0);
 const averageDaysPerStage = totalDays / completedStages.length;
 
 // Calculate progression rate (stages per month)
 const totalDaysActive = calculateDaysActive(deal);
 const stageProgressionRate = (completedStages.length / totalDaysActive) * 30; // Stages per month
 
 // Calculate velocity trend
 let velocityTrend = 'steady';
 
 if (completedStages.length >= 2) {
   const firstHalf = completedStages.slice(0, Math.floor(completedStages.length / 2));
   const secondHalf = completedStages.slice(Math.floor(completedStages.length / 2));
   
   const firstHalfAvg = firstHalf.reduce((sum, stage) => sum + stage.durationDays, 0) / firstHalf.length;
   const secondHalfAvg = secondHalf.reduce((sum, stage) => sum + stage.durationDays, 0) / secondHalf.length;
   
   if (secondHalfAvg < firstHalfAvg * 0.8) {
     velocityTrend = 'accelerating';
   } else if (secondHalfAvg > firstHalfAvg * 1.2) {
     velocityTrend = 'decelerating';
   }
 }
 
 return {
   averageDaysPerStage,
   totalDaysActive,
   stageProgressionRate,
   velocityTrend
 };
}

/**
* Calculate days a deal has been active
* @param {Object} deal - Deal object
* @returns {number} Days active
*/
function calculateDaysActive(deal) {
 const createdDate = new Date(deal.createdAt);
 const now = new Date();
 
 const diffTime = Math.abs(now - createdDate);
 return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
* Calculate customer engagement score
* @param {Array} interactions - Interaction history
* @param {Object} client - Client information
* @returns {Object} Engagement metrics
*/
function calculateEngagementScore(interactions, client) {
 if (!interactions || interactions.length === 0) {
   return {
     score: 0,
     lastActivity: null,
     frequency: 'none',
     sentiment: 'neutral'
   };
 }
 
 // Sort interactions by date (newest first)
 const sortedInteractions = [...interactions].sort((a, b) => 
   new Date(b.date) - new Date(a.date)
 );
 
 // Calculate days since last interaction
 const lastActivity = new Date(sortedInteractions[0].date);
 const now = new Date();
 const daysSinceLastActivity = Math.ceil(Math.abs(now - lastActivity) / (1000 * 60 * 60 * 24));
 
 // Base engagement score
 let score = 100;
 
 // Penalize for days since last activity
 if (daysSinceLastActivity > 7) {
   score -= Math.min(50, (daysSinceLastActivity - 7) * 2);
 }
 
 // Calculate interaction frequency (past 30 days)
 const last30DaysInteractions = interactions.filter(interaction => {
   const interactionDate = new Date(interaction.date);
   const thirtyDaysAgo = new Date();
   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
   return interactionDate >= thirtyDaysAgo;
 });
 
 const interactionsPerMonth = last30DaysInteractions.length;
 
 let frequency;
 if (interactionsPerMonth === 0) {
   frequency = 'none';
   score -= 30;
 } else if (interactionsPerMonth < 2) {
   frequency = 'low';
   score -= 15;
 } else if (interactionsPerMonth < 5) {
   frequency = 'moderate';
   score += 10;
 } else {
   frequency = 'high';
   score += 20;
 }
 
 // Calculate sentiment ratio
 const sentimentCounts = {
   positive: 0,
   neutral: 0,
   negative: 0
 };
 
 interactions.forEach(interaction => {
   sentimentCounts[interaction.sentiment] = (sentimentCounts[interaction.sentiment] || 0) + 1;
 });
 
 const totalInteractions = interactions.length;
 const positiveRatio = sentimentCounts.positive / totalInteractions;
 const negativeRatio = sentimentCounts.negative / totalInteractions;
 
 let sentiment;
 if (positiveRatio > 0.6) {
   sentiment = 'positive';
   score += 20;
 } else if (negativeRatio > 0.4) {
   sentiment = 'negative';
   score -= 30;
 } else {
   sentiment = 'neutral';
 }
 
 // Cap score between 0-100
 score = Math.max(0, Math.min(100, score));
 
 return {
   score,
   daysSinceLastActivity,
   frequency,
   sentiment
 };
}

module.exports = {
 generateDealPrediction,
 calculateVelocityMetrics,
 calculateEngagementScore
};