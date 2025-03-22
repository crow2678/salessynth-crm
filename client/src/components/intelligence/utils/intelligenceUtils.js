// src/utils/intelligenceUtils.js

/**
 * Format deal score for display
 * @param {number} score - Deal success probability score (0-100)
 * @returns {Object} - Formatted score with color and label
 */
export const formatDealScore = (score) => {
  if (typeof score !== 'number') {
    return { value: 'N/A', color: 'text-gray-500', label: 'Unknown' };
  }

  if (score >= 80) {
    return { 
      value: `${score}%`, 
      color: 'text-green-600', 
      bgColor: 'bg-green-100',
      label: 'High' 
    };
  }
  
  if (score >= 60) {
    return { 
      value: `${score}%`, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100',
      label: 'Good' 
    };
  }
  
  if (score >= 40) {
    return { 
      value: `${score}%`, 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-100',
      label: 'Moderate' 
    };
  }
  
  return { 
    value: `${score}%`, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100',
    label: 'Low' 
  };
};

/**
 * Format time in stage
 * @param {string} timeInStage - Time description (e.g., "2 weeks")
 * @param {string} stage - Current deal stage
 * @returns {Object} - Formatted time with color and status
 */
export const formatTimeInStage = (timeInStage, stage) => {
  if (!timeInStage || timeInStage === 'Unknown') {
    return { value: 'Unknown', color: 'text-gray-500', status: 'normal' };
  }

  // Extract number and unit from string like "2 weeks"
  const match = timeInStage.match(/(\d+)\s+(\w+)/);
  if (!match) {
    return { value: timeInStage, color: 'text-gray-500', status: 'normal' };
  }

  const [_, amount, unit] = match;
  const number = parseInt(amount, 10);

  // Expected time ranges by stage (in weeks)
  const stageTimeframes = {
    'prospecting': { max: 4 },
    'qualified': { max: 3 },
    'proposal': { max: 2 },
    'negotiation': { max: 2 }
  };

  // If unit is not weeks, return as-is
  if (unit !== 'weeks' && unit !== 'week') {
    return { value: timeInStage, color: 'text-gray-500', status: 'normal' };
  }

  // Get expected timeframe for stage
  const timeframe = stageTimeframes[stage] || { max: 4 };

  // Determine status based on time in stage
  if (number > timeframe.max * 1.5) {
    return { 
      value: timeInStage, 
      color: 'text-red-600', 
      status: 'extended', 
      message: 'Deal may be stalled' 
    };
  }
  
  if (number > timeframe.max) {
    return { 
      value: timeInStage, 
      color: 'text-yellow-600', 
      status: 'longer', 
      message: 'Taking longer than average' 
    };
  }
  
  return { 
    value: timeInStage, 
    color: 'text-green-600', 
    status: 'normal' 
  };
};

/**
 * Format deal momentum
 * @param {string} momentum - Momentum status (e.g., "Accelerating")
 * @returns {Object} - Formatted momentum with icon and color
 */
export const formatMomentum = (momentum) => {
  if (!momentum) {
    return { 
      label: 'Unknown', 
      icon: 'MinusCircle', 
      color: 'text-gray-500',
      description: 'Momentum cannot be determined' 
    };
  }

  switch (momentum.toLowerCase()) {
    case 'accelerating':
      return { 
        label: 'Accelerating', 
        icon: 'TrendingUp', 
        color: 'text-green-600',
        description: 'Deal is progressing faster than expected' 
      };
    case 'stalling':
      return { 
        label: 'Stalling', 
        icon: 'TrendingDown', 
        color: 'text-red-600',
        description: 'Deal progress has slowed down' 
      };
    case 'steady':
      return { 
        label: 'Steady', 
        icon: 'ArrowRight', 
        color: 'text-blue-600',
        description: 'Deal is progressing at expected pace' 
      };
    default:
      return { 
        label: momentum, 
        icon: 'Circle', 
        color: 'text-gray-600',
        description: 'Current deal momentum' 
      };
  }
};

/**
 * Get deal stage name from key
 * @param {string} stage - Stage key (e.g., "prospecting")
 * @returns {string} - Formatted stage name
 */
export const getDealStageName = (stage) => {
  if (!stage) return 'Unknown';
  
  const stageNames = {
    'prospecting': 'Prospecting',
    'qualified': 'Qualified',
    'proposal': 'Proposal',
    'negotiation': 'Negotiation',
    'closed_won': 'Closed Won',
    'closed_lost': 'Closed Lost'
  };
  
  return stageNames[stage.toLowerCase()] || stage;
};

/**
 * Calculate days until expected close date
 * @param {string} closeDateString - ISO date string
 * @returns {Object} - Days remaining with status
 */
export const getDaysUntilClose = (closeDateString) => {
  if (!closeDateString) {
    return { days: null, status: 'unknown' };
  }
  
  try {
    const closeDate = new Date(closeDateString);
    const today = new Date();
    
    // Reset time portion for accurate day calculation
    today.setHours(0, 0, 0, 0);
    closeDate.setHours(0, 0, 0, 0);
    
    const diffTime = closeDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        days: Math.abs(diffDays), 
        status: 'overdue', 
        text: `${Math.abs(diffDays)} days overdue` 
      };
    }
    
    if (diffDays === 0) {
      return { days: 0, status: 'today', text: 'Due today' };
    }
    
    if (diffDays <= 7) {
      return { 
        days: diffDays, 
        status: 'soon', 
        text: `${diffDays} days remaining` 
      };
    }
    
    return { 
      days: diffDays, 
      status: 'future', 
      text: `${diffDays} days remaining` 
    };
  } catch (err) {
    console.error('Error calculating days until close:', err);
    return { days: null, status: 'error' };
  }
};

/**
 * Format impact score for display
 * @param {number} impact - Impact score (0-100)
 * @returns {Object} - Formatted impact with color class
 */
export const formatImpact = (impact) => {
  if (typeof impact !== 'number') {
    return { value: 'N/A', colorClass: 'bg-gray-100 text-gray-800' };
  }
  
  if (impact >= 80) {
    return { value: impact, colorClass: 'bg-green-100 text-green-800' };
  }
  
  if (impact >= 60) {
    return { value: impact, colorClass: 'bg-blue-100 text-blue-800' };
  }
  
  if (impact >= 40) {
    return { value: impact, colorClass: 'bg-yellow-100 text-yellow-800' };
  }
  
  return { value: impact, colorClass: 'bg-red-100 text-red-800' };
};

/**
 * Group and prioritize deal recommendations
 * @param {Array} recommendations - Array of recommendation strings
 * @returns {Array} - Grouped and prioritized recommendations
 */
export const processRecommendations = (recommendations) => {
  if (!recommendations || !Array.isArray(recommendations)) {
    return [];
  }
  
  // Keywords for categorization
  const categories = {
    'highPriority': ['asap', 'urgent', 'immediately', 'critical', 'important'],
    'meeting': ['meet', 'call', 'schedule', 'contact', 'follow up', 'demo'],
    'content': ['send', 'provide', 'share', 'prepare', 'document', 'case study'],
    'technical': ['technical', 'integration', 'api', 'security', 'implementation'],
    'financial': ['pricing', 'discount', 'budget', 'roi', 'cost', 'financial']
  };
  
  return recommendations.map(rec => {
    // Determine category
    let category = 'general';
    let priority = 'medium';
    
    const lowerRec = rec.toLowerCase();
    
    // Check for high priority indicators
    if (categories.highPriority.some(kw => lowerRec.includes(kw))) {
      priority = 'high';
    }
    
    // Determine category based on keywords
    for (const [cat, keywords] of Object.entries(categories)) {
      if (cat === 'highPriority') continue; // Skip priority category
      
      if (keywords.some(kw => lowerRec.includes(kw))) {
        category = cat;
        break;
      }
    }
    
    return {
      text: rec,
      category,
      priority
    };
  });
};

/**
 * Check if deal intelligence needs refresh
 * @param {Object} intelligence - Deal intelligence data
 * @param {number} cooldownPeriodHours - Cooldown period in hours
 * @returns {boolean} - Whether intelligence needs refresh
 */
export const needsRefresh = (intelligence, cooldownPeriodHours = 12) => {
  if (!intelligence || !intelligence.timestamp) {
    return true;
  }
  
  try {
    const lastUpdate = new Date(intelligence.timestamp);
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours > cooldownPeriodHours;
  } catch (err) {
    console.error('Error checking if intelligence needs refresh:', err);
    return true;
  }
};

export default {
  formatDealScore,
  formatTimeInStage,
  formatMomentum,
  getDealStageName,
  getDaysUntilClose,
  formatImpact,
  processRecommendations,
  needsRefresh
};