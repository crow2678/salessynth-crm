// src/components/intelligence/IntelligenceModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  MessageCircle, 
  BarChart2, 
  X, 
  Download, 
  ExternalLink,
  AlertCircle 
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="animate-pulse">
      <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
        <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

// Error Display Component
const ErrorDisplay = ({ message }) => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <div className="text-red-500 font-medium">{message}</div>
    </div>
  </div>
);

// No Report Display Component
const NoReportDisplay = ({ companyName }) => (
  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
    <Brain className="w-16 h-16 text-blue-200 mb-6" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      Generating Intelligence Report
    </h3>
    <p className="text-gray-600 max-w-md mb-4">
      We're currently analyzing data for <span className="font-semibold">{companyName || 'this company'}</span>. 
      This process typically takes a few minutes to ensure comprehensive insights.
    </p>
    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
      <div className="animate-pulse flex space-x-1">
        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
      </div>
      <span className="ml-2">Report generation in progress</span>
    </div>
  </div>
);

const IntelligenceModal = ({ isOpen, onClose, clientId, userId, clientName }) => {
  const [activeTab, setActiveTab] = useState('ai');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [researchData, setResearchData] = useState(null);
  const [googleData, setGoogleData] = useState(null);
  const [redditData, setRedditData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    console.log("📡 Debugging IntelligenceModal Props:");
    console.log("clientId:", clientId);
    console.log("userId:", userId);

    if (!clientId || !userId || !isOpen) {
      console.error("🚨 Missing clientId or userId. Skipping API call.");
      return;
    }

    const fetchResearchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`📡 Fetching research summary for Client ID: ${clientId}, User ID: ${userId}`);

        // ✅ Fetch main research summary
        const mainResponse = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
        const mainData = mainResponse.data;

        // ✅ Fetch Google data separately
        let googleResults = null;
        try {
		  const googleResponse = await axios.get(`${API_URL}/research/google/${clientId}`);
		  googleResults = googleResponse.data?.googleData || null;
		} catch (googleErr) {
		  console.log("Info: Google data not available for this client");
		  // No need to show warnings for expected 404s
		  googleResults = null;
		}

        // ✅ Fetch Reddit data separately
        let redditResults = null;
        try {
          const redditResponse = await axios.get(`${API_URL}/research/reddit/${clientId}`);
          redditResults = redditResponse.data?.redditData || null;
        } catch (redditErr) {
          console.warn("⚠️ Reddit data not found:", redditErr.response?.data || redditErr.message);
        }

        // ✅ Combine fetched data
        const combinedData = {
          ...mainData,
          data: {
            ...mainData.data,
            google: googleResults || mainData.data?.google || null,
            reddit: redditResults || mainData.data?.reddit || null
          }
        };

        // ✅ Update state
        setResearchData(combinedData);
        setGoogleData(combinedData.data?.google || null);
        setRedditData(combinedData.data?.reddit || null);
        setLastUpdated(mainData.timestamp ? new Date(mainData.timestamp).toLocaleDateString() : "Not available");

      } catch (err) {
        console.error("❌ Error fetching research data:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load research data.");
      } finally {
        setLoading(false);
      }
    };

    fetchResearchData();
  }, [clientId, userId, isOpen]);

  if (!isOpen) return null;

  const displayName = researchData?.company || clientName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh]">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Intelligence Report - {displayName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated}
            </p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <LoadingSkeleton /> : error ? <ErrorDisplay message={error} /> : <div className="p-8">
            {activeTab === 'ai' && <p>AI Summary Here</p>}
            {activeTab === 'web' && <p>Google Search Data Here</p>}
            {activeTab === 'social' && <p>Reddit Data Here</p>}
          </div>}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;
