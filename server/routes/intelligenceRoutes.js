// routes/intelligenceRoutes.js
const express = require('express');
const router = express.Router();
const Deal = require('../models/Deal');
const Client = require('../models/Client');
const Feedback = require('../models/Feedback');
const Interaction = require('../models/Interaction');
const Research = require('../database/db').Research;
const { runPDLResearch, updateClientWithPDLData } = require('../PDLResearch');
const predictionEngine = require('../utils/predictionEngine');

// Middleware to verify deal ownership
const verifyDealOwnership = async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ 
      _id: req.params.dealId, 
      userId: req.userId 
    });
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found or unauthorized' });
    }
    
    req.deal = deal;
    next();
  } catch (error) {
    console.error('Deal verification error:', error);
    res.status(500).json({ message: 'Error verifying deal' });
  }
};

/**
 * Helper function to fetch and identify all available research data sources for a client
 * This approach makes it easy to add new data sources in the future
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Available research data and sources
 */
async function getResearchData(clientId, userId) {
  try {
    // Fetch the research document
    const research = await Research.findOne({ clientId, userId });
    
    if (!research || !research.data) {
      return { 
        availableSources: [],
        data: {},
        lastUpdated: {},
        timestamp: null
      };
    }
    
    // Determine which data sources are available
    const availableSources = [];
    const dataCollection = {};
    const lastUpdated = research.lastUpdated || {};
    
    // Look through the data object to see what's available
    // This approach makes adding new sources in the future easy
    Object.keys(research.data).forEach(source => {
      // Check if the source has valid data
      const sourceData = research.data[source];
      
      if (sourceData) {
        // For array sources (like Google results), check if it has items
        if (Array.isArray(sourceData) && sourceData.length > 0) {
          availableSources.push(source);
          dataCollection[source] = sourceData;
        } 
        // For object sources (like PDL data), check if it has content
        else if (typeof sourceData === 'object' && Object.keys(sourceData).length > 0) {
          availableSources.push(source);
          dataCollection[source] = sourceData;
        }
      }
    });
    
    return {
      availableSources,
      data: dataCollection,
      lastUpdated,
      timestamp: research.timestamp
    };
  } catch (error) {
    console.error('Error fetching research data:', error);
    return { 
      availableSources: [],
      data: {},
      lastUpdated: {},
      timestamp: null
    };
  }
}

/**
 * Helper function to attempt to fetch new research data if needed
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @param {string} companyName - Company name
 * @param {Array} existingSources - Already available data sources
 * @returns {Promise<Object>} - Updated research data
 */
async function fetchMissingResearchData(clientId, userId, companyName, existingSources = []) {
  const results = {
    newSources: [],
    data: {}
  };
  
  // Only try to fetch PDL if not already available
  if (!existingSources.includes('pdl') && companyName) {
    try {
      console.log(`Fetching PDL data for ${companyName}`);
      const pdlData = await runPDLResearch(companyName, clientId, userId);
      
      if (pdlData) {
        results.newSources.push('pdl');
        results.data.pdl = pdlData;
      }
    } catch (err) {
      console.log('PDL fetch error:', err.message);
    }
  }
  
  // Add future API fetch attempts here
  // The pattern will be the same - check if it's not in existingSources, then try to fetch
  
  return results;
}

// Generate prediction for a deal
router.post('/deals/:dealId/predict', verifyDealOwnership, async (req, res) => {
  try {
    const deal = req.deal;
    const client = await Client.findById(deal.clientId);
    
    if (!client) {
      return res.status(404).json({ message: 'Associated client not found' });
    }
    
    // Get all existing research data
    const researchInfo = await getResearchData(client._id, req.userId);
    console.log(`Available research sources: ${researchInfo.availableSources.join(', ')}`);
    
    // Try to fetch any missing research data
    const additionalData = await fetchMissingResearchData(
      client._id, 
      req.userId, 
      client.company, 
      researchInfo.availableSources
    );
    
    // Merge existing and new data
    const allSources = [...researchInfo.availableSources, ...additionalData.newSources];
    const combinedData = {...researchInfo.data, ...additionalData.data};
    
    console.log(`Total research sources: ${allSources.join(', ')}`);
    
    // Get interactions
    const interactions = await Interaction.find({
      dealId: deal._id,
      userId: req.userId
    }).sort({ date: -1 }).limit(10).lean();
    
    // Generate prediction using all available data
    const prediction = await predictionEngine.generateDealPrediction(
      deal, 
      client, 
      combinedData,
      interactions
    );
    
    if (!prediction) {
      return res.status(400).json({ message: 'Unable to generate prediction' });
    }
    
    // Add data sources used for this prediction
    prediction.dataSources = allSources;
    
    // Save the prediction to the deal
    deal.predictions.push(prediction);
    await deal.save();
    
    // Update client's predictions too
    client.predictions.push({
      dealId: deal._id,
      probability: prediction.probability,
      updatedAt: new Date(),
      factors: prediction.factors,
      stageEstimates: prediction.stageEstimates,
      predictedCloseDate: prediction.predictedCloseDate,
      confidenceScore: prediction.confidenceScore,
      source: prediction.source,
      dataSources: allSources
    });
    await client.save();
    
    res.json(prediction);
  } catch (error) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ message: 'Error generating prediction', error: error.message });
  }
});

// Get comprehensive intelligence for a deal
router.get('/deals/:dealId/intelligence', verifyDealOwnership, async (req, res) => {
  try {
    const deal = req.deal;
    
    // Get the client to access company information
    const client = await Client.findById(deal.clientId).lean();
    
    if (!client) {
      return res.status(404).json({ message: 'Associated client not found' });
    }
    
    // Get all existing research data
    const researchInfo = await getResearchData(client._id, req.userId);
    console.log(`Available research sources for intelligence: ${researchInfo.availableSources.join(', ')}`);
    
    // Try to fetch any missing research data
    const additionalData = await fetchMissingResearchData(
      client._id, 
      req.userId, 
      client.company, 
      researchInfo.availableSources
    );
    
    // Merge existing and new data
    const allSources = [...researchInfo.availableSources, ...additionalData.newSources];
    const combinedData = {...researchInfo.data, ...additionalData.data};
    
    // Get interactions for context
    const interactions = await Interaction.find({
      dealId: deal._id,
      userId: req.userId
    }).sort({ date: -1 }).limit(10).lean();
    
    // Get feedback on predictions
    const feedback = await Feedback.find({
      dealId: deal._id,
      userId: req.userId
    }).sort({ createdAt: -1 }).limit(5).lean();
    
    // Calculate additional metrics
    const stageMetrics = deal.calculateStageMetrics();
    const velocityMetrics = predictionEngine.calculateVelocityMetrics(deal);
    const engagementScore = predictionEngine.calculateEngagementScore(interactions, client);
    
    // Get the latest prediction
    const latestPrediction = deal.getLatestPrediction();
    
    // Construct the intelligence response
    const intelligence = {
      deal: deal.toJSON(),
      client: client,
      research: {
        availableSources: allSources,
        data: combinedData,
        lastUpdated: researchInfo.lastUpdated,
        timestamp: researchInfo.timestamp
      },
      interactions: interactions,
      feedback: feedback,
      prediction: latestPrediction,
      stageMetrics: stageMetrics,
      velocityMetrics: velocityMetrics,
      engagementScore: engagementScore,
      recommendations: [] // Will be populated by AI in later implementation
    };
    
    res.json(intelligence);
  } catch (error) {
    console.error('Error fetching deal intelligence:', error);
    res.status(500).json({ message: 'Error fetching deal intelligence', error: error.message });
  }
});

// Submit feedback on predictions
router.post('/deals/:dealId/feedback', verifyDealOwnership, async (req, res) => {
  try {
    const { predictionId, rating, feedbackType, comments } = req.body;
    
    // Validate required fields
    if (!rating || !feedbackType) {
      return res.status(400).json({ message: 'Rating and feedback type are required' });
    }
    
    // Create and save feedback
    const feedback = new Feedback({
      userId: req.userId,
      dealId: req.deal._id,
      clientId: req.deal.clientId,
      predictionId: predictionId,
      rating: rating,
      feedbackType: feedbackType,
      comments: comments
    });
    
    await feedback.save();
    
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ message: 'Error saving feedback', error: error.message });
  }
});

// Get research data for a client
router.get('/research/:clientId', async (req, res) => {
  try {
    const clientId = req.params.clientId;
    
    // Get the client to access company information
    const client = await Client.findOne({ _id: clientId, userId: req.userId });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Get all existing research data
    const researchInfo = await getResearchData(clientId, req.userId);
    
    // Try to fetch any missing research data if we have company name
    if (client.company) {
      const additionalData = await fetchMissingResearchData(
        clientId, 
        req.userId, 
        client.company, 
        researchInfo.availableSources
      );
      
      // Merge the new data with existing data
      const allSources = [...researchInfo.availableSources, ...additionalData.newSources];
      const combinedData = {...researchInfo.data, ...additionalData.data};
      
      // If PDL data was newly fetched, update client record
      if (additionalData.newSources.includes('pdl')) {
        await updateClientWithPDLData(clientId);
      }
      
      // Return the combined results
      return res.json({
        clientId,
        company: client.company,
        availableSources: allSources,
        data: combinedData,
        lastUpdated: researchInfo.lastUpdated,
        timestamp: researchInfo.timestamp
      });
    }
    
    // If no company name or no new data, return what we have
    res.json({
      clientId,
      company: client.company,
      availableSources: researchInfo.availableSources,
      data: researchInfo.data,
      lastUpdated: researchInfo.lastUpdated,
      timestamp: researchInfo.timestamp
    });
  } catch (error) {
    console.error('Error fetching research data:', error);
    res.status(500).json({ message: 'Error fetching research data', error: error.message });
  }
});

// Get prediction stats for a user
router.get('/stats', async (req, res) => {
  try {
    // Get overall prediction stats
    const deals = await Deal.find({ userId: req.userId });
    
    // Calculate accuracy statistics
    let totalPredictions = 0;
    let accuratePredictions = 0;
    
    deals.forEach(deal => {
      const finishedPredictions = deal.predictions.filter(p => 
        p.actualOutcome === 'accurate' || p.actualOutcome === 'inaccurate'
      );
      
      totalPredictions += finishedPredictions.length;
      accuratePredictions += finishedPredictions.filter(p => p.actualOutcome === 'accurate').length;
    });
    
    // Calculate stage duration statistics
    const stageStats = {};
    const stageNames = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    
    stageNames.forEach(stage => {
      stageStats[stage] = { totalDays: 0, count: 0, avgDays: 0 };
    });
    
    deals.forEach(deal => {
      deal.stageHistory.forEach(history => {
        if (history.durationDays && stageNames.includes(history.stage)) {
          stageStats[history.stage].totalDays += history.durationDays;
          stageStats[history.stage].count += 1;
        }
      });
    });
    
    Object.keys(stageStats).forEach(stage => {
      if (stageStats[stage].count > 0) {
        stageStats[stage].avgDays = stageStats[stage].totalDays / stageStats[stage].count;
      }
    });
    
    // Get high-value deal predictions
    const highValueDeals = await Deal.find({
      userId: req.userId,
      value: { $gt: 50000 },
      'predictions.0': { $exists: true }
    }).limit(5).lean();
    
    // Collect data source usage stats
    const dataSourceStats = {};
    deals.forEach(deal => {
      if (!deal.predictions) return;
      
      deal.predictions.forEach(prediction => {
        if (prediction.dataSources && Array.isArray(prediction.dataSources)) {
          prediction.dataSources.forEach(source => {
            dataSourceStats[source] = (dataSourceStats[source] || 0) + 1;
          });
        }
      });
    });
    
    res.json({
      predictionStats: {
        totalPredictions,
        accuratePredictions,
        accuracyRate: totalPredictions > 0 ? (accuratePredictions / totalPredictions) : 0,
      },
      stageStats,
      dataSourceStats,
      highValueDeals: highValueDeals.map(deal => ({
        id: deal._id,
        title: deal.title,
        value: deal.value,
        status: deal.status,
        latestPrediction: deal.predictions.sort((a, b) => 
          new Date(b.predictedAt) - new Date(a.predictedAt)
        )[0]
      }))
    });
  } catch (error) {
    console.error('Error fetching intelligence stats:', error);
    res.status(500).json({ message: 'Error fetching intelligence stats', error: error.message });
  }
});

module.exports = router;