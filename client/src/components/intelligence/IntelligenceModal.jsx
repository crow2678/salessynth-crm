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

// Google News Card Component
const GoogleNewsCard = ({ item }) => (
  <div className="bg-white border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-2">
      <div className="flex-1">
        <h3 className="font-medium text-blue-600 hover:underline">{item.title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.snippet}</p>
        <div className="flex items-center mt-2 text-xs text-gray-500">
          <span className="font-medium">{item.source}</span>
          <span className="mx-2">•</span>
          <span>{item.publishedDate}</span>
        </div>
      </div>
      <ExternalLink className="text-gray-400 w-4 h-4 flex-shrink-0 mt-1" />
    </a>
  </div>
);

// Reddit Post Card Component
const RedditPostCard = ({ post }) => (
  <div className="bg-white border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
    <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
      <h3 className="font-medium text-blue-600 hover:underline">{post.title}</h3>
      <div className="flex items-center mt-2 text-xs text-gray-500">
        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
          r/{post.subreddit}
        </span>
        <span className="mx-2">•</span>
        <span>{post.upvotes} upvotes</span>
        <span className="mx-2">•</span>
        <span>{post.comments} comments</span>
      </div>
    </a>
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

        // ✅ Use the correct endpoint route that you've defined on your server
        const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
        const data = response.data;
        
        if (!data) {
          setError("No research data available for this client.");
          setLoading(false);
          return;
        }
        
        // Extract data and update state
        setResearchData(data);
        setGoogleData(data.data?.google || []);
        setRedditData(data.data?.reddit || []);
        setLastUpdated(data.timestamp ? new Date(data.timestamp).toLocaleDateString() : "Not available");

      } catch (err) {
        console.error("❌ Error fetching research data:", err.response?.data || err.message);
        setError(err.response?.status === 404 
          ? "No research data available for this client yet."
          : "Failed to load research data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResearchData();
  }, [clientId, userId, isOpen]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  const displayName = researchData?.companyName || clientName || "Company";
  const isSummaryAvailable = researchData?.summary;
  const areGoogleResultsAvailable = googleData && Array.isArray(googleData) && googleData.length > 0;
  const areRedditResultsAvailable = redditData && Array.isArray(redditData) && redditData.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Intelligence Report - {displayName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated || "N/A"}
            </p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'ai' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('ai')}
          >
            <Brain className="w-5 h-5 mr-2" />
            <span>AI Summary</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'web' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('web')}
          >
            <Search className="w-5 h-5 mr-2" />
            <span>Web Research</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'social' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('social')}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <span>Social Insights</span>
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : (
            <div className="p-8">
              {activeTab === 'ai' && (
                <div>
                  {isSummaryAvailable ? (
                    <div className="prose prose-blue max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: researchData.summary.replace(/\n/g, '<br>') }} />
                    </div>
                  ) : (
                    <NoReportDisplay companyName={displayName} />
                  )}
                </div>
              )}
              
              {activeTab === 'web' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Latest Web Research</h3>
                  {areGoogleResultsAvailable ? (
                    <div className="space-y-4">
                      {googleData.map((item, index) => (
                        <GoogleNewsCard key={index} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No web research available for this company yet.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'social' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Social Media Insights</h3>
                  {areRedditResultsAvailable ? (
                    <div className="space-y-4">
                      {redditData.map((post, index) => (
                        <RedditPostCard key={index} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No social media insights available for this company yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;