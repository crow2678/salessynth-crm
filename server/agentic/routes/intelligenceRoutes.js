// src/agentic/routes/intelligenceRoutes.js
const express = require('express');
const { generateDealIntelligence } = require('../research/DealSummary');
const { Research } = require('../database/db');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

/**
 * @route GET /api/intelligence/deals/:clientId
 * @desc Get deal intelligence for a specific client
 * @access Private
 */
router.get('/intelligence/deals/:clientId', authMiddleware, async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.userId;

    if (!clientId || !userId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    console.log(`🔍 Fetching deal intelligence for Client ID: ${clientId}, User ID: ${userId}`);

    // Get existing intelligence from Research collection
    const existingResearch = await Research.findOne(
      { clientId, userId },
      { 'data.dealIntelligence': 1, lastUpdated: 1 }
    );

    // Check if we have deal intelligence data
    const dealIntelligence = existingResearch?.data?.dealIntelligence;
    const lastUpdated = existingResearch?.lastUpdated?.dealIntelligence;

    // If no deal intelligence exists, trigger generation and inform client
    if (!dealIntelligence) {
      console.log(`⏳ No deal intelligence found. Triggering generation for client ${clientId}...`);
      
      // Trigger intelligence generation (async)
      generateDealIntelligence(clientId, userId).catch(err => {
        console.error(`❌ Error generating deal intelligence: ${err.message}`);
      });
      
      return res.status(202).json({ 
        message: 'Deal intelligence is being generated', 
        status: 'processing' 
      });
    }

    // Return existing deal intelligence
    return res.json({
      dealIntelligence,
      lastUpdated: lastUpdated || new Date(),
      status: 'complete'
    });
  } catch (error) {
    console.error('❌ Error in deal intelligence endpoint:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

/**
 * @route POST /api/intelligence/deals/:clientId/refresh
 * @desc Force refresh deal intelligence for a client
 * @access Private
 */
router.post('/intelligence/deals/:clientId/refresh', authMiddleware, async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.userId;

    if (!clientId || !userId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    console.log(`🔄 Force refreshing deal intelligence for Client ID: ${clientId}, User ID: ${userId}`);

    // Trigger intelligence generation
    const result = await generateDealIntelligence(clientId, userId);
    
    if (result) {
      // Get the newly generated intelligence
      const updatedResearch = await Research.findOne(
        { clientId, userId },
        { 'data.dealIntelligence': 1, lastUpdated: 1 }
      );
      
      return res.json({
        message: 'Deal intelligence refreshed successfully',
        status: 'complete',
        dealIntelligence: updatedResearch?.data?.dealIntelligence || null,
        lastUpdated: updatedResearch?.lastUpdated?.dealIntelligence || new Date()
      });
    } else {
      return res.status(202).json({
        message: 'Deal intelligence refresh initiated',
        status: 'processing'
      });
    }
  } catch (error) {
    console.error('❌ Error refreshing deal intelligence:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

/**
 * @route GET /api/intelligence/batch
 * @desc Trigger batch generation of deal intelligence for all clients
 * @access Private (Admin only)
 */
router.post('/intelligence/batch', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (you can use your own admin middleware here)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Import batch processing function
    const { processAllClientDeals } = require('../research/DealSummary');
    
    // Trigger batch processing (non-blocking)
    processAllClientDeals().catch(err => {
      console.error(`❌ Error in batch deal intelligence processing: ${err.message}`);
    });
    
    res.json({ 
      message: 'Batch deal intelligence generation initiated',
      status: 'processing' 
    });
  } catch (error) {
    console.error('❌ Error in batch deal intelligence endpoint:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;