// src/components/intelligence/IntelligenceModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  MessageCircle, 
  ChevronRight,
  X, 
  ExternalLink,
  AlertCircle,
  Building,
  Users,
  TrendingUp,
  Calendar,
  Globe,
  FileText
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
const GoogleNewsCard = ({ item, compact = false }) => (
  <div className={`bg-white border rounded-lg ${compact ? 'p-3 mb-2' : 'p-4 mb-3'} hover:shadow-md transition-shadow`}>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-2">
      <div className="flex-1">
        <h3 className={`font-medium text-blue-600 hover:underline ${compact ? 'text-sm' : ''}`}>{item.title}</h3>
        {!compact && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.snippet}</p>
        )}
        <div className={`flex items-center ${compact ? 'mt-1 text-xs' : 'mt-2 text-xs'} text-gray-500`}>
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
const RedditPostCard = ({ post, compact = false }) => (
  <div className={`bg-white border rounded-lg ${compact ? 'p-3 mb-2' : 'p-4 mb-3'} hover:shadow-md transition-shadow`}>
    <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
      <h3 className={`font-medium text-blue-600 hover:underline ${compact ? 'text-sm' : ''}`}>{post.title}</h3>
      <div className={`flex items-center ${compact ? 'mt-1 text-xs' : 'mt-2 text-xs'} text-gray-500`}>
        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
          r/{post.subreddit}
        </span>
        <span className="mx-2">•</span>
        <span>{post.upvotes} upvotes</span>
        {!compact && (
          <>
            <span className="mx-2">•</span>
            <span>{post.comments} comments</span>
          </>
        )}
      </div>
    </a>
  </div>
);

// Company Profile Component
const CompanyProfile = ({ data }) => {
  if (!data) return null;
  
  const companyInfo = data.companyInfo || {};
  const keyPeople = data.keyPeople || [];
  
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{companyInfo.name}</h3>
          <p className="text-sm text-gray-600">{companyInfo.industry}</p>
        </div>
        {companyInfo.socialProfiles?.linkedin && (
          <a href={companyInfo.socialProfiles.linkedin} target="_blank" rel="noopener noreferrer"
             className="text-blue-600 hover:text-blue-700">
            <ExternalLink size={18} />
          </a>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Size</p>
          <p>{companyInfo.estimatedEmployees ? `~${companyInfo.estimatedEmployees} employees` : companyInfo.sizeRange || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-gray-500">Founded</p>
          <p>{companyInfo.yearFounded || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-gray-500">Revenue</p>
          <p>{companyInfo.annualRevenue || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-gray-500">Location</p>
          <p>{[companyInfo.location?.city, companyInfo.location?.state, companyInfo.location?.country].filter(Boolean).join(', ') || 'Unknown'}</p>
        </div>
      </div>
      
      {companyInfo.description && (
        <div className="mt-4">
          <p className="text-gray-500 text-sm">Description</p>
          <p className="text-sm">{companyInfo.description}</p>
        </div>
      )}
      
      {keyPeople.length > 0 && (
        <div className="mt-4">
          <p className="text-gray-500 text-sm font-medium mb-2">Key People</p>
          {keyPeople.map((person, idx) => (
            <div key={idx} className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                {person.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-medium text-sm">{person.name}</p>
                <p className="text-xs text-gray-500">{person.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Format the Markdown text properly
const formatMarkdown = (text) => {
  if (!text) return '';
  
  // Handle bold text
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Make section titles bold
  formattedText = formattedText.replace(/(###\s+[0-9️⃣]+\s+.*?)$/gm, '<h3 class="font-bold text-lg mb-3">$1</h3>');
  
  // Replace newlines with <br>
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
};

// Format the MongoDB timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Not available';
  
  // Check if it's a MongoDB $date object
  if (timestamp.$date) {
    return new Date(timestamp.$date).toLocaleDateString();
  }
  
  // Regular date string
  return new Date(timestamp).toLocaleDateString();
};

const IntelligenceModal = ({ isOpen, onClose, clientId, userId, clientName }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [researchData, setResearchData] = useState(null);
  const [googleData, setGoogleData] = useState(null);
  const [redditData, setRedditData] = useState(null);
  const [apolloData, setApolloData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!clientId || !userId || !isOpen) {
      return;
    }

    const fetchResearchData = async () => {
      setLoading(true);
      setError(null);

      try {
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
        setApolloData(data.data?.apollo || null);
        
        // Set last updated using the MongoDB timestamp format
        setLastUpdated(data.timestamp || null);

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

  // Use companyName from the research data instead of clientName
  const displayName = researchData?.companyName || clientName || "Company";
  const isSummaryAvailable = researchData?.summary;
  const areGoogleResultsAvailable = googleData && Array.isArray(googleData) && googleData.length > 0;
  const areRedditResultsAvailable = redditData && Array.isArray(redditData) && redditData.length > 0;
  const isApolloDataAvailable = apolloData && Object.keys(apolloData).length > 0;

  // Generate dynamic title based on data availability
  let dynamicTitle = "Sales Intelligence";
  if (areGoogleResultsAvailable && areRedditResultsAvailable) {
    dynamicTitle = "360° Intelligence Brief";
  } else if (areGoogleResultsAvailable) {
    dynamicTitle = "Market Intelligence Report";
  } else if (areRedditResultsAvailable) {
    dynamicTitle = "Social Intelligence Insights";
  } else if (isApolloDataAvailable) {
    dynamicTitle = "Company Intelligence Profile";
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">{dynamicTitle}: {displayName}</h2>
            <p className="text-sm text-blue-100 mt-1">
              Intelligence updated: {formatTimestamp(lastUpdated)}
            </p>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" onClick={onClose}>
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('dashboard')}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            <span>Dashboard</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'ai' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('ai')}
          >
            <Brain className="w-5 h-5 mr-2" />
            <span>AI Analysis</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'company' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('company')}
          >
            <Building className="w-5 h-5 mr-2" />
            <span>Company Profile</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'web' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('web')}
          >
            <Globe className="w-5 h-5 mr-2" />
            <span>Web Research</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'social' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('social')}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <span>Social Insights</span>
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Summary Column */}
                    <div className="col-span-2 space-y-4">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Key Sales Insights</h3>
                          <button 
                            onClick={() => handleTabClick('ai')}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            Full Analysis <ChevronRight size={16} />
                          </button>
                        </div>
                        
                        {isSummaryAvailable ? (
                          <div className="prose prose-blue max-w-none prose-sm">
                            <div dangerouslySetInnerHTML={{ 
                              __html: formatMarkdown(researchData.summary) 
                            }} />
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">AI analysis is being generated...</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Web Research Preview */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Latest News</h3>
                          {areGoogleResultsAvailable && (
                            <button 
                              onClick={() => handleTabClick('web')}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              View All <ChevronRight size={16} />
                            </button>
                          )}
                        </div>
                        
                        {areGoogleResultsAvailable ? (
                          <div>
                            {googleData.slice(0, 3).map((item, index) => (
                              <GoogleNewsCard key={index} item={item} compact={true} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No news articles available yet</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Social Insights Preview */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Social Media Mentions</h3>
                          {areRedditResultsAvailable && (
                            <button 
                              onClick={() => handleTabClick('social')}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              View All <ChevronRight size={16} />
                            </button>
                          )}
                        </div>
                        
                        {areRedditResultsAvailable ? (
                          <div>
                            {redditData.slice(0, 2).map((post, index) => (
                              <RedditPostCard key={index} post={post} compact={true} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No social media mentions found</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Company Profile Column */}
                    <div className="space-y-4">
                      {isApolloDataAvailable ? (
                        <CompanyProfile data={apolloData} />
                      ) : (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center py-8">
                          <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="font-semibold text-gray-700">{displayName}</h3>
                          <p className="text-gray-500 mt-2">Company profile is being generated</p>
                        </div>
                      )}
                      
                      {/* Intelligence Source Card */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Intelligence Sources</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${isApolloDataAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm">Company Data</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${areGoogleResultsAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm">News Articles</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${areRedditResultsAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm">Social Mentions</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${isSummaryAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm">AI Analysis</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Last Updated Card */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-start">
                          <Calendar className="text-blue-500 mr-3 mt-1" />
                          <div>
                            <h3 className="font-bold text-gray-900">Last Updated</h3>
                            <p className="text-gray-600 text-sm mt-1">{formatTimestamp(lastUpdated)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'ai' && (
                <div className="p-8 max-w-4xl mx-auto bg-white shadow-sm rounded-lg my-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Sales Intelligence</h2>
                  
                  {isSummaryAvailable ? (
                    <div className="prose prose-blue max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: formatMarkdown(researchData.summary) 
                      }} />
                    </div>
                  ) : (
                    <NoReportDisplay companyName={displayName} />
                  )}
                </div>
              )}
              
              {activeTab === 'company' && (
                <div className="p-8 max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Profile</h2>
                  
                  {isApolloDataAvailable ? (
                    <div className="bg-white shadow-sm rounded-lg p-8">
                      <CompanyProfile data={apolloData} />
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                      <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700">{displayName}</h3>
                      <p className="text-gray-500 mt-3 max-w-md mx-auto">
                        We're currently gathering company information. Check back soon for detailed company insights.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'web' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Web Research</h2>
                  
                  {areGoogleResultsAvailable ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {googleData.map((item, index) => (
                        <GoogleNewsCard key={index} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                      <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No News Articles Found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        We couldn't find any recent news articles for {displayName}. Check back later for updates.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'social' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Insights</h2>
                  
                  {areRedditResultsAvailable ? (
                    <div className="space-y-4 max-w-4xl">
                      {redditData.map((post, index) => (
                        <RedditPostCard key={index} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Social Media Mentions</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        We couldn't find any recent social media mentions for {displayName}. Check back later for updates.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;