// src/components/intelligence/IntelligenceModal.jsx
import React, { useState, useEffect } from 'react';
import { Brain, Search, MessageCircle, BarChart2, X, Download, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Intelligence Report</h2>
            <p className="text-sm text-gray-500 mt-1">
              {clientName} • Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors"
              onClick={() => {/* Implement PDF export */}}
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
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
              <div className="p-8">
                {activeTab === 'ai' && researchData?.summary && (
                  <>
                    {/* Summary Box */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-6 mb-8 border border-blue-100">
                      <div className="flex items-start gap-4">
                        <Brain className="w-6 h-6 text-blue-600 mt-1" />
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: researchData.summary }}
                        />
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
                              <a href={article.url} target="_blank" rel="noopener noreferrer" className="group">
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