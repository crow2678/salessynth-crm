// src/utils/predictionUtils.js

/**
 * Utility functions for deal predictions and analytics
 */

/**
 * Calculate the probability trend based on prediction history
 * @param {Array} predictions - Array of prediction objects ordered by date
 * @returns {Object} Trend information including direction and percentage change
 */
export const calculateProbabilityTrend = (predictions) => {
  if (!predictions || predictions.length < 2) {
    return { direction: 'steady', change: 0, description: 'Insufficient data' };
  }

  // Sort predictions by date if not already sorted
  const sortedPredictions = [...predictions].sort((a, b) => 
    new Date(a.predictedAt) - new Date(b.predictedAt)
  );
  
  const firstPrediction = sortedPredictions[0];
  const latestPrediction = sortedPredictions[sortedPredictions.length - 1];
  
  const change = latestPrediction.probability - firstPrediction.probability;
  const percentChange = (change / firstPrediction.probability) * 100;
  
  let direction = 'steady';
  let description = 'No significant change';
  
  if (percentChange > 10) {
    direction = 'increasing';
    description = 'Significant positive trend';
  } else if (percentChange > 3) {
    direction = 'slightly-increasing';
    description = 'Slight positive trend';
  } else if (percentChange < -10) {
    direction = 'decreasing';
    description = 'Significant negative trend';
  } else if (percentChange < -3) {
    direction = 'slightly-decreasing';
    description = 'Slight negative trend';
  }
  
  return {
    direction,
    change: Math.abs(percentChange).toFixed(1),
    description,
    rawChange: change
  };
};

/**
 * Calculate the weighted probability based on multiple prediction factors
 * @param {Object} dealData - Deal information
 * @param {Array} factors - Array of positive and negative factors
 * @returns {number} Weighted probability score (0-100)
 */
export const calculateWeightedProbability = (dealData, factors) => {
  // Base probability based on deal stage
  const stageWeights = {
    'prospecting': 20,
    'qualified': 40,
    'proposal': 60,
    'negotiation': 75,
    'closed_won': 100,
    'closed_lost': 0
  };
  
  // Start with base probability from stage
  let probability = stageWeights[dealData.status] || 50;
  
  // Adjust based on positive factors
  if (factors.positive && factors.positive.length > 0) {
    // Each positive factor can add up to 5% (with diminishing returns)
    const positiveAdjustment = Math.min(
      factors.positive.length * 3,
      15
    );
    probability += positiveAdjustment;
  }
  
  // Adjust based on negative factors
  if (factors.negative && factors.negative.length > 0) {
    // Each negative factor can subtract up to 5% (with increasing impact)
    const negativeAdjustment = Math.min(
      factors.negative.length * 4,
      20
    );
    probability -= negativeAdjustment;
  }
  
  // Consider time in stage (longer time typically reduces probability)
  if (dealData.stageHistory && dealData.stageHistory.length > 0) {
    const currentStage = dealData.stageHistory.find(s => s.stage === dealData.status);
    if (currentStage && currentStage.durationDays) {
      // Adjust based on average stage duration
      const avgDuration = getAverageStageDuration(dealData.status);
      if (avgDuration && currentStage.durationDays > avgDuration * 1.5) {
        // Penalty for staying in stage too long
        probability -= Math.min(currentStage.durationDays / avgDuration * 5, 15);
      }
    }
  }
  
  // Consider deal value (higher value deals often have more scrutiny)
  if (dealData.value) {
    const averageDealValue = 50000; // Example value, should be configured
    if (dealData.value > averageDealValue * 2) {
      probability -= 5; // Higher scrutiny for large deals
    }
  }
  
  // Ensure probability stays within 0-100 range
  return Math.min(Math.max(probability, 0), 100);
};

/**
 * Get average duration for each deal stage (in days)
 * This could be fetched from analytics or configured
 * @param {string} stage - Deal stage name
 * @returns {number} Average duration in days
 */
export const getAverageStageDuration = (stage) => {
  // These values should ideally come from analyzing past deals
  const averageDurations = {
    'prospecting': 14,
    'qualified': 21,
    'proposal': 14,
    'negotiation': 10,
    'closed_won': 7,
    'closed_lost': 7
  };
  
  return averageDurations[stage] || 14;
};

/**
 * Calculate the estimated close date based on current stage and average durations
 * @param {Object} deal - Deal information
 * @param {Array} predictions - Previous predictions (optional)
 * @returns {Date} Estimated close date
 */
export const calculateEstimatedCloseDate = (deal, predictions = []) => {
  // Get the current date as starting point
  const today = new Date();
  
  // If we have previous predictions with estimated close dates, use trend analysis
  if (predictions.length > 1) {
    const recentPredictions = predictions
      .filter(p => p.predictedCloseDate)
      .sort((a, b) => new Date(b.predictedAt) - new Date(a.predictedAt))
      .slice(0, 3);
    
    if (recentPredictions.length > 0) {
      // Use the most recent prediction's close date
      return new Date(recentPredictions[0].predictedCloseDate);
    }
  }
  
  // Otherwise calculate based on average stage durations
  const remainingStages = getRemainingStages(deal.status);
  let totalRemainingDays = 0;
  
  remainingStages.forEach(stage => {
    totalRemainingDays += getAverageStageDuration(stage);
  });
  
  // Add time remaining in current stage
  if (deal.stageHistory && deal.stageHistory.length > 0) {
    const currentStage = deal.stageHistory.find(s => s.stage === deal.status);
    if (currentStage && currentStage.durationDays) {
      const avgDuration = getAverageStageDuration(deal.status);
      const remainingCurrentStageDays = Math.max(avgDuration - currentStage.durationDays, 0);
      totalRemainingDays += remainingCurrentStageDays;
    } else {
      totalRemainingDays += getAverageStageDuration(deal.status);
    }
  }
  
  // Calculate the close date
  const estimatedCloseDate = new Date(today);
  estimatedCloseDate.setDate(today.getDate() + totalRemainingDays);
  
  return estimatedCloseDate;
};

/**
 * Get array of remaining stages based on current stage
 * @param {string} currentStage - Current deal stage
 * @returns {Array} Array of remaining stage names
 */
export const getRemainingStages = (currentStage) => {
  const orderedStages = [
    'prospecting',
    'qualified',
    'proposal',
    'negotiation',
    'closed_won'
  ];
  
  const currentIndex = orderedStages.indexOf(currentStage);
  if (currentIndex === -1) return [];
  
  return orderedStages.slice(currentIndex + 1);
};

/**
 * Extract success and risk factors from deal data
 * @param {Object} deal - Deal information
 * @param {Object} client - Client information
 * @param {Object} metadata - Additional metadata for analysis
 * @returns {Object} Factors object with positive and negative arrays
 */
export const extractDealFactors = (deal, client, metadata = {}) => {
  const factors = {
    positive: [],
    negative: []
  };
  
  // Analyze deal structure for positive factors
  if (deal.value && deal.value > 0) {
    factors.positive.push('Deal value specified');
  }
  
  if (deal.expectedCloseDate) {
    factors.positive.push('Expected close date defined');
  }
  
  // Analyze client data for factors
  if (client) {
    if (client.lastContact) {
      const lastContactDate = new Date(client.lastContact);
      const daysSinceContact = Math.floor((new Date() - lastContactDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceContact < 7) {
        factors.positive.push('Recent client contact');
      } else if (daysSinceContact > 30) {
        factors.negative.push('No recent client contact');
      }
    } else {
      factors.negative.push('No contact history recorded');
    }
    
    if (client.notes && client.notes.length > 0) {
      factors.positive.push('Detailed client notes available');
      
      // Analyze notes for keywords indicating progress
      const notes = client.notes.toLowerCase();
      
      if (notes.includes('interested') || notes.includes('positive')) {
        factors.positive.push('Client expressed interest');
      }
      
      if (notes.includes('budget') || notes.includes('funding')) {
        factors.positive.push('Budget discussion documented');
      }
      
      if (notes.includes('concern') || notes.includes('issue') || notes.includes('problem')) {
        factors.negative.push('Client concerns noted');
      }
      
      if (notes.includes('competitor') || notes.includes('alternative')) {
        factors.negative.push('Competitive pressure indicated');
      }
    } else {
      factors.negative.push('No client notes available');
    }
  }
  
  // Analyze stage history for velocity
  if (deal.stageHistory && deal.stageHistory.length > 0) {
    const sortedHistory = [...deal.stageHistory].sort(
      (a, b) => new Date(a.enteredAt) - new Date(b.enteredAt)
    );
    
    // Check progression velocity
    if (sortedHistory.length >= 2) {
      const firstStageDate = new Date(sortedHistory[0].enteredAt);
      const latestStageDate = new Date(sortedHistory[sortedHistory.length - 1].enteredAt);
      const totalDays = Math.floor((latestStageDate - firstStageDate) / (1000 * 60 * 60 * 24));
      const stagesPerMonth = (sortedHistory.length / totalDays) * 30;
      
      if (stagesPerMonth > 1.5) {
        factors.positive.push('Fast deal progression');
      } else if (stagesPerMonth < 0.5) {
        factors.negative.push('Slow deal progression');
      }
    }
    
    // Check for stage regression (going backward)
    const stageRank = {
      'prospecting': 1,
      'qualified': 2,
      'proposal': 3,
      'negotiation': 4,
      'closed_won': 5,
      'closed_lost': 0
    };
    
    let hasRegression = false;
    
    for (let i = 1; i < sortedHistory.length; i++) {
      if (stageRank[sortedHistory[i].stage] < stageRank[sortedHistory[i-1].stage]) {
        hasRegression = true;
        break;
      }
    }
    
    if (hasRegression) {
      factors.negative.push('Deal has regressed to earlier stages');
    }
  }
  
  // Include metadata-based factors if available
  if (metadata.interactions) {
    if (metadata.interactions.count > 5) {
      factors.positive.push('Multiple client interactions recorded');
    }
    
    if (metadata.interactions.recent) {
      factors.positive.push('Recent client engagement');
    }
  }
  
  if (metadata.competitors) {
    if (metadata.competitors.length > 0) {
      factors.negative.push(`Competing against ${metadata.competitors.length} alternatives`);
    }
  }
  
  return factors;
};

/**
 * Calculate confidence score for a prediction
 * @param {Object} prediction - Prediction object
 * @param {Object} dealData - Deal data used for prediction
 * @param {Array} dataSources - Data sources used for prediction
 * @returns {number} Confidence score (0-100)
 */
export const calculateConfidenceScore = (prediction, dealData, dataSources = []) => {
  let score = 70; // Default base confidence
  
  // More data sources increases confidence
  if (dataSources && dataSources.length > 0) {
    score += Math.min(dataSources.length * 5, 15);
  }
  
  // More factors increases confidence
  const totalFactors = (prediction.factors?.positive?.length || 0) + 
                      (prediction.factors?.negative?.length || 0);
  if (totalFactors > 5) {
    score += 5;
  } else if (totalFactors < 2) {
    score -= 10;
  }
  
  // More complete deal data increases confidence
  const hasCompleteData = dealData.value && 
                         dealData.expectedCloseDate && 
                         dealData.stageHistory && 
                         dealData.stageHistory.length > 1;
  
  if (hasCompleteData) {
    score += 5;
  } else {
    score -= 10;
  }
  
  // Very high or very low probabilities have potentially lower confidence
  if (prediction.probability > 95 || prediction.probability < 5) {
    score -= 5;
  }
  
  // Ensure score stays within 0-100 range
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Format a prediction object for display or API submission
 * @param {Object} prediction - Raw prediction object
 * @returns {Object} Formatted prediction object
 */
export const formatPrediction = (prediction) => {
  if (!prediction) return null;
  
  return {
    ...prediction,
    probability: Math.round(prediction.probability),
    predictedCloseDate: prediction.predictedCloseDate 
      ? new Date(prediction.predictedCloseDate).toISOString()
      : null,
    predictedAt: prediction.predictedAt
      ? new Date(prediction.predictedAt).toISOString()
      : new Date().toISOString(),
    // Ensure factors are clean arrays
    factors: {
      positive: Array.isArray(prediction.factors?.positive) 
        ? prediction.factors.positive 
        : [],
      negative: Array.isArray(prediction.factors?.negative)
        ? prediction.factors.negative
        : []
    }
  };
};

/**
 * Generate stage predictions for remaining deal stages
 * @param {string} currentStage - Current deal stage
 * @param {Object} dealData - Deal information for context
 * @returns {Array} Array of stage predictions with estimated days
 */
export const generateStagePredictions = (currentStage, dealData) => {
  const remainingStages = getRemainingStages(currentStage);
  const stagePredictions = [];
  
  if (remainingStages.length === 0) {
    return [];
  }
  
  // Calculate baseline estimates using average durations
  remainingStages.forEach(stage => {
    stagePredictions.push({
      stage,
      estimatedDays: getAverageStageDuration(stage)
    });
  });
  
  // Adjust estimates based on deal specifics
  if (dealData) {
    // If deal has high value, extend negotiation
    if (dealData.value > 100000 && stagePredictions.some(s => s.stage === 'negotiation')) {
      const index = stagePredictions.findIndex(s => s.stage === 'negotiation');
      stagePredictions[index].estimatedDays += 5;
    }
    
    // Adjust based on client notes
    if (dealData.notes && dealData.notes.toLowerCase().includes('urgent')) {
      // Reduce all estimates by 20%
      stagePredictions.forEach(stagePred => {
        stagePred.estimatedDays = Math.max(Math.floor(stagePred.estimatedDays * 0.8), 1);
      });
    }
    
    // If deal is already in late stages, reduce remaining estimates
    if (currentStage === 'proposal' || currentStage === 'negotiation') {
      stagePredictions.forEach(stagePred => {
        stagePred.estimatedDays = Math.max(Math.floor(stagePred.estimatedDays * 0.9), 1);
      });
    }
  }
  
  return stagePredictions;
};

/**
 * Determine if a prediction has become inaccurate based on actual deal movement
 * @param {Object} prediction - Original prediction
 * @param {Object} currentDealData - Current deal state for comparison
 * @returns {boolean} Whether the prediction is now inaccurate
 */
export const isPredictionInaccurate = (prediction, currentDealData) => {
  if (!prediction || !currentDealData) return false;
  
  // If prediction was for closing but deal is lost
  if (prediction.probability > 70 && currentDealData.status === 'closed_lost') {
    return true;
  }
  
  // If prediction was for losing but deal is won
  if (prediction.probability < 30 && currentDealData.status === 'closed_won') {
    return true;
  }
  
  // If prediction expected close date has passed by >30 days and deal is still open
  if (prediction.predictedCloseDate) {
    const predictedDate = new Date(prediction.predictedCloseDate);
    const today = new Date();
    const daysPassed = Math.floor((today - predictedDate) / (1000 * 60 * 60 * 24));
    
    if (daysPassed > 30 && currentDealData.status !== 'closed_won' && currentDealData.status !== 'closed_lost') {
      return true;
    }
  }
  
  return false;
};

/**
 * Get key performance indicators for deal tracking
 * @param {Object} deal - Deal information
 * @param {Array} predictions - Prediction history 
 * @returns {Object} KPIs for the deal
 */
export const getDealKPIs = (deal, predictions = []) => {
  if (!deal) return {};
  
  const kpis = {
    forecastAccuracy: null,
    velocityIndex: null,
    healthScore: null,
    riskLevel: 'medium'
  };
  
  // Calculate forecast accuracy if we have predictions and actual outcome
  if (predictions.length > 0 && (deal.status === 'closed_won' || deal.status === 'closed_lost')) {
    // Get latest prediction before close
    const closeDate = deal.closedAt || deal.updatedAt;
    const relevantPredictions = predictions.filter(p => 
      new Date(p.predictedAt) < new Date(closeDate)
    );
    
    if (relevantPredictions.length > 0) {
      const lastPrediction = relevantPredictions[relevantPredictions.length - 1];
      
      // Actual outcome: 1 for won, 0 for lost
      const actualOutcome = deal.status === 'closed_won' ? 1 : 0;
      
      // Convert probability to 0-1 scale
      const predictedProbability = lastPrediction.probability / 100;
      
      // Calculate accuracy as 1 - abs(actual - predicted)
      kpis.forecastAccuracy = Math.round((1 - Math.abs(actualOutcome - predictedProbability)) * 100);
    }
  }
  
  // Calculate velocity index
  if (deal.stageHistory && deal.stageHistory.length > 0) {
    const stageProgression = deal.stageHistory.map(stage => ({
      name: stage.stage,
      duration: stage.durationDays || 0
    }));
    
    // Compare to average durations
    let velocityRatio = 0;
    let totalStages = 0;
    
    stageProgression.forEach(stage => {
      const avgDuration = getAverageStageDuration(stage.name);
      if (avgDuration && stage.duration > 0) {
        velocityRatio += avgDuration / stage.duration;
        totalStages++;
      }
    });
    
    if (totalStages > 0) {
      // >1 means faster than average, <1 means slower
      kpis.velocityIndex = parseFloat((velocityRatio / totalStages).toFixed(2));
    }
  }
  
  // Calculate health score based on various factors
  let healthScore = 50; // Start at neutral
  
  // Adjust based on stage changes
  if (deal.stageHistory && deal.stageHistory.length > 0) {
    // Progressive movement through stages is good
    healthScore += Math.min((deal.stageHistory.length - 1) * 5, 15);
    
    // Check if any regression happened (moving backward in stages)
    const hasRegression = checkForStageRegression(deal.stageHistory);
    if (hasRegression) {
      healthScore -= 20;
    }
  }
  
  // Adjust based on current stage
  const stageScores = {
    'prospecting': 0,
    'qualified': 10,
    'proposal': 20,
    'negotiation': 25,
    'closed_won': 50,
    'closed_lost': -50
  };
  
  healthScore += stageScores[deal.status] || 0;
  
  // Determine risk level
  if (healthScore >= 70) {
    kpis.riskLevel = 'low';
  } else if (healthScore <= 30) {
    kpis.riskLevel = 'high';
  }
  
  // Ensure health score is within 0-100 range
  kpis.healthScore = Math.min(Math.max(Math.round(healthScore), 0), 100);
  
  return kpis;
};

/**
 * Check if deal has experienced stage regression (backward movement)
 * @param {Array} stageHistory - Deal stage history
 * @returns {boolean} Whether regression occurred
 */
const checkForStageRegression = (stageHistory) => {
  if (!stageHistory || stageHistory.length < 2) return false;
  
  // Define stage progression order
  const stageOrder = {
    'prospecting': 1,
    'qualified': 2,
    'proposal': 3, 
    'negotiation': 4,
    'closed_won': 5,
    'closed_lost': 0 // Special case
  };
  
  // Sort by date
  const sortedHistory = [...stageHistory].sort(
    (a, b) => new Date(a.enteredAt) - new Date(b.enteredAt)
  );
  
  // Check for regression in order
  let highestStage = 0;
  let hasRegression = false;
  
  sortedHistory.forEach(stage => {
    const currentValue = stageOrder[stage.stage] || 0;
    // Skip comparison for closed_lost (it can happen at any point)
    if (stage.stage !== 'closed_lost') {
      if (currentValue < highestStage) {
        hasRegression = true;
      }
      highestStage = Math.max(highestStage, currentValue);
    }
  });
  
  return hasRegression;
};