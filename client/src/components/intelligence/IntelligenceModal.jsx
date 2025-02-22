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

const IntelligenceModal = ({ isOpen, onClose, clientId, clientName }) => {
  const [activeTab, setActiveTab] = useState('ai');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [researchData, setResearchData] = useState(null);

  useEffect(() => {
    const fetchResearchData = async () => {
      if (!clientId || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/research/${clientId}`);
        setResearchData(response.data);
      } catch (err) {
        console.error('Error fetching research data:', err);
        setError('Failed to load research data');
      } finally {
        setLoading(false);
      }
    };

    fetchResearchData();
  }, [clientId, isOpen]);

  // Format the summary text with proper styling
  const formatSummaryContent = (text) => {
    if (!text) return [];
    
    return text.split('\n').map((point, index) => {
      const trimmedPoint = point.trim();
      if (!trimmedPoint) return null;

      // Handle numbered points with emoji
      const numberMatch = trimmedPoint.match(/^([1️⃣2️⃣]) /);
      if (numberMatch) {
        const number = numberMatch[1] === '1️⃣' ? '1' : '2';
        const content = trimmedPoint.replace(/^[1️⃣2️⃣] /, '');
        return {
          type: 'numbered',
          number,
          content
        };
      }

      // Handle bold sections
      if (trimmedPoint.startsWith('**')) {
        const parts = trimmedPoint.split('**').filter(Boolean);
        return {
          type: 'section',
          title: parts[0],
          content: parts.slice(1).join('')
        };
      }

      return {
        type: 'text',
        content: trimmedPoint
      };
    }).filter(Boolean);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Intelligence Report</h2>
            <p className="text-sm text-gray-500 mt-1">
              {clientName} • Last updated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex h-[calc(80vh-88px)]">
          {/* Sidebar */}
          <div className="w-60 border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full flex items-center p-3 rounded-lg mb-2 transition-colors ${
                  activeTab === 'ai' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Brain className="w-5 h-5 mr-3" />
                <span>AI Summary</span>
              </button>

              <button
                onClick={() => setActiveTab('web')}
                className={`w-full flex items-center p-3 rounded-lg mb-2 transition-colors ${
                  activeTab === 'web' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Search className="w-5 h-5 mr-3" />
                <span>Web Search</span>
              </button>

              <button
                onClick={() => setActiveTab('social')}
                className={`w-full flex items-center p-3 rounded-lg mb-2 transition-colors ${
                  activeTab === 'social' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-5 h-5 mr-3" />
                <span>Social</span>
              </button>

              <button
                onClick={() => setActiveTab('industry')}
                className={`w-full flex items-center p-3 rounded-lg mb-2 transition-colors ${
                  activeTab === 'industry' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart2 className="w-5 h-5 mr-3" />
                <span>Industry</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorDisplay message={error} />
            ) : (
              <div className="p-8">
                {activeTab === 'ai' && researchData?.summary && (
                  <>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis Summary</h3>
                      <p className="text-sm text-gray-500">
                        Key insights and recommendations for {clientName}
                      </p>
                    </div>

                    {/* Summary Box */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-6 mb-8 border border-blue-100">
                      <div className="flex items-start gap-4">
                        <Brain className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="prose max-w-none space-y-4">
                          {formatSummaryContent(researchData.summary).map((item, index) => {
                            if (item.type === 'numbered') {
                              return (
                                <div key={index} className="flex items-start gap-3 mb-4">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                                    {item.number}
                                  </span>
                                  <div className="flex-1 text-gray-600">{item.content}</div>
                                </div>
                              );
                            }
                            if (item.type === 'section') {
                              return (
                                <div key={index} className="mb-4">
                                  <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                                  <p className="text-gray-600">{item.content}</p>
                                </div>
                              );
                            }
                            return (
                              <p key={index} className="text-gray-600">{item.content}</p>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Google Search Results */}
                    {researchData.data?.google && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                          Latest Articles
                        </h4>
                        <div className="space-y-4">
                          {researchData.data.google.map((article, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                              <a 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="group"
                              >
                                <h5 className="text-lg font-medium text-blue-600 group-hover:text-blue-700 flex items-center mb-2">
                                  {article.title}
                                  <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h5>
                              </a>
                              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                {article.snippet}
                              </p>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="font-medium text-gray-900">{article.source}</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'web' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">Web Intelligence</h3>
                    <div className="text-gray-500">Web content coming soon...</div>
                  </div>
                )}

                {activeTab === 'social' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">Social Intelligence</h3>
                    <div className="text-gray-500">Social content coming soon...</div>
                  </div>
                )}

                {activeTab === 'industry' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">Industry Insights</h3>
                    <div className="text-gray-500">Industry content coming soon...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;