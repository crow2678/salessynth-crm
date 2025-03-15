// src/hooks/useDealIntelligence.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

/**
 * Custom hook for fetching and managing deal intelligence data
 * 
 * @param {string} clientId - The ID of the client
 * @param {string} userId - The ID of the user
 * @param {boolean} autoFetch - Whether to automatically fetch data on mount
 * @returns {Object} - Deal intelligence data and utility functions
 */
const useDealIntelligence = (clientId, userId, autoFetch = true) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // States for individual data sources
  const [summaryData, setSummaryData] = useState(null);
  const [googleData, setGoogleData] = useState([]);
  const [pdlData, setPdlData] = useState(null);
  const [apolloData, setApolloData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  
  // Sources tracking
  const [availableSources, setAvailableSources] = useState([]);
  
  /**
   * Process and organize fetched research data
   */
  const processResearchData = useCallback((researchData) => {
    if (!researchData) return;
    
    // Set the full data object
    setData(researchData);
    
    // Set last updated timestamp
    setLastUpdated(researchData.timestamp || new Date());
    
    // Set summary if available
    if (researchData.summary) {
      setSummaryData(researchData.summary);
    }
    
    // Track available data sources
    const sources = [];
    
    // Process Google data if available
    if (researchData.data?.google && Array.isArray(researchData.data.google) && researchData.data.google.length > 0) {
      setGoogleData(researchData.data.google);
      sources.push('google');
    }
    
    // Process Apollo data if available (legacy support)
    if (researchData.data?.apollo && Object.keys(researchData.data.apollo).length > 0) {
      setApolloData(researchData.data.apollo);
      sources.push('apollo');
    }
    
    // Process PDL data if available
    if (researchData.data?.pdl) {
      const pdlData = researchData.data.pdl;
      // Create a normalized PDL data structure
      setPdlData({
        companyName: pdlData.companyData?.display_name || pdlData.companyData?.name || pdlData.company || "Unknown",
        industry: pdlData.companyData?.industry || "Unknown",
        size: pdlData.companyData?.employee_count || pdlData.companyData?.size || "Unknown",
        location: pdlData.companyData?.location || null,
        summary: pdlData.companyData?.summary || null,
        linkedInUrl: pdlData.companyData?.linkedin_url || null,
        dealScore: pdlData.dealScore || 0,
        currentStage: pdlData.currentStage || "Prospecting",
        dealValue: pdlData.dealValue || "$0",
        hasPdlCompanyData: !!pdlData.companyData,
        factors: pdlData.factors || {
          positive: [],
          negative: []
        },
        stageData: pdlData.stageData || {},
        requirements: pdlData.requirements || [],
        recommendations: pdlData.recommendations || [],
        nextStage: pdlData.nextStage || {},
        marketData: pdlData.marketData || []
      });
      sources.push('pdl');
    }
    
    // Process prediction data if available (separate endpoint)
    if (researchData.prediction) {
      setPredictionData(researchData.prediction);
      sources.push('prediction');
    }
    
    // Update available sources
    setAvailableSources(sources);
  }, []);
  
  /**
   * Primary function to fetch research data
   */
  const fetchIntelligence = useCallback(async () => {
    if (!clientId || !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
      processResearchData(response.data);
    } catch (err) {
      console.error("Error fetching research data:", err.response?.data || err.message);
      setError(err.response?.status === 404 
        ? "No research data available for this client yet."
        : "Failed to load research data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [clientId, userId, processResearchData]);
  
  /**
   * Generate a new prediction specifically for a deal
   */
  const generatePrediction = useCallback(async (dealId) => {
    if (!dealId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/deals/${dealId}/predict`);
      setPredictionData(response.data);
      return response.data;
    } catch (err) {
      console.error("Error generating prediction:", err.response?.data || err.message);
      setError("Failed to generate prediction. Please try again later.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Submit feedback on a prediction
   */
  const submitFeedback = useCallback(async (dealId, predictionId, feedbackData) => {
    if (!dealId || !predictionId || !feedbackData) return false;
    
    try {
      await axios.post(`${API_URL}/deals/${dealId}/feedback`, {
        predictionId,
        ...feedbackData
      });
      return true;
    } catch (err) {
      console.error("Error submitting feedback:", err.response?.data || err.message);
      return false;
    }
  }, []);
  
  /**
   * Force refresh intelligence data
   */
  const refreshIntelligence = useCallback(async () => {
    if (!clientId || !userId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.post(`${API_URL}/research/refresh`, { clientId, userId });
      // Wait a moment to allow the backend to process
      setTimeout(() => {
        fetchIntelligence();
      }, 1000);
      return true;
    } catch (err) {
      console.error("Error refreshing intelligence:", err.response?.data || err.message);
      setError("Failed to refresh intelligence data. Please try again later.");
      setLoading(false);
      return false;
    }
  }, [clientId, userId, fetchIntelligence]);
  
  // Fetch data on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch && clientId && userId) {
      fetchIntelligence();
    }
  }, [autoFetch, clientId, userId, fetchIntelligence]);
  
  return {
    // Data
    loading,
    error,
    data,
    lastUpdated,
    summaryData,
    googleData,
    pdlData,
    apolloData,
    predictionData,
    availableSources,
    
    // Functions
    fetchIntelligence,
    generatePrediction,
    submitFeedback,
    refreshIntelligence,
    
    // Utility check functions
    hasSummary: !!summaryData,
    hasGoogleData: googleData.length > 0,
    hasPdlData: !!pdlData,
    hasApolloData: !!apolloData,
    hasPrediction: !!predictionData
  };
};

export default useDealIntelligence;