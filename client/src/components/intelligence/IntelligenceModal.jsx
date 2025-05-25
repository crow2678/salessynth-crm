// IntelligenceModal.jsx - Part 1: Imports, Dashboard Tab, and Core Components
import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Calendar,
  MessageSquare,
  Copy,
  ExternalLink,
  RefreshCw,
  Target,
  Zap,
  Shield,
  Lightbulb,
  ArrowRight,
  Info,
  Star
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

// Enhanced Dashboard Tab Component
const DashboardTab = ({ intelligence, clientName, onCopyToClipboard }) => {
  if (!intelligence) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing deal intelligence...</p>
        </div>
      </div>
    );
  }
  
  // Handle no deals or closed deals scenarios
  if (intelligence.message) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Deals</h3>
          <p className="text-gray-600 mb-4">{intelligence.message}</p>
          <p className="text-sm text-gray-500 mb-6">{intelligence.suggestion}</p>
          
          {intelligence.nextActions && intelligence.nextActions.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Recommended Actions:</h4>
              <div className="space-y-2">
                {intelligence.nextActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{action.action}</p>
                      <p className="text-xs text-gray-500">Expected: {action.expectedOutcome}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        action.priority === 'high' ? 'bg-red-100 text-red-800' :
                        action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {action.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  const dealScore = intelligence.dealScore || 50;
  const momentum = intelligence.momentum || 'steady';
  const confidence = intelligence.confidence || 50;
  
  // Deal health color coding
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  // Momentum icon
  const getMomentumIcon = (momentum) => {
    switch (momentum) {
      case 'accelerating': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'stalling': return <Minus className="w-5 h-5 text-yellow-500" />;
      default: return <Minus className="w-5 h-5 text-blue-500" />;
    }
  };
  
  const healthColor = getHealthColor(dealScore);
  const momentumIcon = getMomentumIcon(momentum);
  
  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className={`p-6 rounded-lg border-2 ${healthColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6" />
            <h3 className="text-xl font-bold">Deal Health Score</h3>
          </div>
          <div className="flex items-center space-x-2">
            {momentumIcon}
            <span className="text-sm font-medium capitalize">{momentum}</span>
          </div>
        </div>
        
        <div className="flex items-end space-x-4 mb-4">
          <div className="text-5xl font-bold">{dealScore}%</div>
          <div className="pb-2">
            <div className="text-sm text-gray-600">Confidence: {confidence}%</div>
            <div className="text-sm text-gray-600">Stage: {intelligence.currentStage}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{intelligence.stageData?.timeInStage || 'Unknown'} in stage</span>
          </div>
          {intelligence.industryBenchmark && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>{intelligence.industryBenchmark.comparison} vs benchmark</span>
            </div>
          )}
        </div>
        
        <p className="mt-3 text-sm opacity-80">{intelligence.reasoning}</p>
      </div>
      
      {/* Quick Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Priority Actions */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-orange-500" />
            <h4 className="font-semibold">Top Priority Actions</h4>
          </div>
          <div className="space-y-2">
            {intelligence.nextActions?.slice(0, 3).map((action, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  action.priority === 'high' ? 'bg-red-400' :
                  action.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{action.action}</p>
                  <p className="text-xs text-gray-500">{action.deadline}</p>
                </div>
              </div>
            )) || [
              <div key="default" className="text-sm text-gray-500">
                No specific actions identified
              </div>
            ]}
          </div>
        </div>
        
        {/* Risk Alerts */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-red-500" />
            <h4 className="font-semibold">Risk Alerts</h4>
          </div>
          <div className="space-y-2">
            {intelligence.riskFactors?.slice(0, 3).map((risk, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                  risk.severity === 'high' ? 'text-red-500' :
                  risk.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{risk.risk}</p>
                  <p className="text-xs text-gray-500">{risk.mitigation}</p>
                </div>
              </div>
            )) || [
              <div key="no-risks" className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">No major risks identified</span>
              </div>
            ]}
          </div>
        </div>
      </div>
      
      {/* Key Insights & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Insights */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold">Key Insights</h4>
          </div>
          <div className="space-y-2">
            {intelligence.keyInsights?.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  insight.impact === 'high' ? 'bg-red-400' :
                  insight.impact === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{insight.insight}</p>
                  {insight.actionRequired && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 mt-1">
                      Action Required
                    </span>
                  )}
                </div>
              </div>
            )) || [
              <div key="default" className="text-sm text-gray-500">
                No specific insights available
              </div>
            ]}
          </div>
        </div>
        
        {/* Opportunities */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold">Opportunities</h4>
          </div>
          <div className="space-y-2">
            {intelligence.opportunities?.slice(0, 3).map((opportunity, index) => (
              <div key={index} className="flex items-start space-x-2">
                <ArrowRight className={`w-4 h-4 mt-0.5 ${
                  opportunity.potential === 'high' ? 'text-green-500' :
                  opportunity.potential === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{opportunity.opportunity}</p>
                  <p className="text-xs text-gray-500">{opportunity.action}</p>
                </div>
              </div>
            )) || [
              <div key="default" className="text-sm text-gray-500">
                No specific opportunities identified
              </div>
            ]}
          </div>
        </div>
      </div>
      
      {/* Conversation Starters */}
      {intelligence.conversationStarters && intelligence.conversationStarters.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Smart Conversation Starters</h4>
          </div>
          <div className="space-y-3">
            {intelligence.conversationStarters.slice(0, 2).map((starter, index) => (
              <div key={index} className="bg-white p-3 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-blue-900">{starter.topic}</p>
                    <p className="text-sm text-gray-700 mt-1">"{starter.question}"</p>
                    <p className="text-xs text-gray-500 mt-1">{starter.purpose}</p>
                  </div>
                  <button
                    onClick={() => onCopyToClipboard(starter.question)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded"
                    title="Copy question"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Industry Benchmark */}
      {intelligence.industryBenchmark && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold">Industry Benchmark</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{intelligence.industryBenchmark.typicalStageLength}</p>
              <p className="text-xs text-gray-600">Typical Stage Length</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{intelligence.industryBenchmark.successProbability}</p>
              <p className="text-xs text-gray-600">Success Probability</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${
                intelligence.industryBenchmark.comparison === 'above average' ? 'text-red-600' :
                intelligence.industryBenchmark.comparison === 'below average' ? 'text-green-600' :
                'text-gray-900'
              }`}>
                {intelligence.industryBenchmark.comparison}
              </p>
              <p className="text-xs text-gray-600">vs Industry</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// IntelligenceModal.jsx - Part 2: Main Modal Component, Detailed Analysis Tab, and Export

// Main Intelligence Modal Component
const IntelligenceModal = ({ isOpen, onClose, clientId, userId, clientName }) => {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copyFeedback, setCopyFeedback] = useState('');

  // Fetch intelligence data
  useEffect(() => {
    if (isOpen && clientId && userId) {
      fetchIntelligence();
    }
  }, [isOpen, clientId, userId]);

  const fetchIntelligence = async () => {
    if (!clientId || !userId) {
      setError('Missing client or user information');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching intelligence for client ${clientId}, user ${userId}`);
      
      const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
      
      if (response.data && response.data.dealIntelligence) {
        setIntelligence(response.data.dealIntelligence);
      } else {
        setError('No intelligence data available for this client');
      }
    } catch (err) {
      console.error('Error fetching intelligence:', err);
      setError(err.response?.data?.message || 'Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Copied to clipboard!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const handleRefresh = () => {
    fetchIntelligence();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">Deal Intelligence</h2>
            <p className="text-blue-100">{clientName || 'Client Analysis'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh Intelligence"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Copy Feedback */}
        {copyFeedback && (
          <div className="absolute top-20 right-6 bg-green-500 text-white px-3 py-1 rounded-md text-sm z-10">
            {copyFeedback}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Smart Dashboard</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'detailed'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Detailed Analysis</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing deal intelligence...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-600 font-medium mb-2">Error Loading Intelligence</p>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  intelligence={intelligence} 
                  clientName={clientName}
                  onCopyToClipboard={handleCopyToClipboard}
                />
              )}
              
              {activeTab === 'detailed' && (
                <DetailedAnalysisTab 
                  intelligence={intelligence}
                  onCopyToClipboard={handleCopyToClipboard}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Detailed Analysis Tab Component
const DetailedAnalysisTab = ({ intelligence, onCopyToClipboard }) => {
  if (!intelligence) {
    return <div className="text-center text-gray-500">No detailed analysis available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Full Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Complete Analysis</h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">{intelligence.reasoning}</p>
        </div>
      </div>

      {/* All Risk Factors */}
      {intelligence.riskFactors && intelligence.riskFactors.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 text-red-500 mr-2" />
            All Risk Factors
          </h3>
          <div className="space-y-4">
            {intelligence.riskFactors.map((risk, index) => (
              <div key={index} className="border-l-4 border-red-200 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{risk.risk}</h4>
                    <p className="text-sm text-gray-600 mt-1">{risk.mitigation}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        risk.severity === 'high' ? 'bg-red-100 text-red-700' :
                        risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {risk.severity} severity
                      </span>
                      {risk.timeline && (
                        <span className="text-xs text-gray-500">Timeline: {risk.timeline}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Next Actions */}
      {intelligence.nextActions && intelligence.nextActions.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 text-orange-500 mr-2" />
            All Recommended Actions
          </h3>
          <div className="space-y-4">
            {intelligence.nextActions.map((action, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{action.action}</h4>
                    <p className="text-sm text-gray-600 mt-1">{action.expectedOutcome}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        action.priority === 'high' ? 'bg-red-100 text-red-700' :
                        action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {action.priority} priority
                      </span>
                      <span className="text-xs text-gray-500">Deadline: {action.deadline}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onCopyToClipboard(action.action)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded"
                    title="Copy action"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Opportunities */}
      {intelligence.opportunities && intelligence.opportunities.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 text-green-500 mr-2" />
            All Opportunities
          </h3>
          <div className="space-y-4">
            {intelligence.opportunities.map((opportunity, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{opportunity.opportunity}</h4>
                    <p className="text-sm text-gray-600 mt-1">{opportunity.action}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        opportunity.potential === 'high' ? 'bg-green-100 text-green-700' :
                        opportunity.potential === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {opportunity.potential} potential
                      </span>
                      {opportunity.timeline && (
                        <span className="text-xs text-gray-500">Timeline: {opportunity.timeline}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onCopyToClipboard(opportunity.action)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded"
                    title="Copy opportunity"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Key Insights */}
      {intelligence.keyInsights && intelligence.keyInsights.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 text-blue-500 mr-2" />
            All Key Insights
          </h3>
          <div className="space-y-4">
            {intelligence.keyInsights.map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">{insight.insight}</p>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {insight.impact} impact
                      </span>
                      {insight.actionRequired && (
                        <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">
                          Action Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Conversation Starters */}
      {intelligence.conversationStarters && intelligence.conversationStarters.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 text-purple-500 mr-2" />
            All Conversation Starters
          </h3>
          <div className="space-y-4">
            {intelligence.conversationStarters.map((starter, index) => (
              <div key={index} className="border rounded-lg p-4 bg-purple-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {starter.topic}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mb-2">"{starter.question}"</p>
                    <p className="text-sm text-gray-600">{starter.purpose}</p>
                  </div>
                  <button
                    onClick={() => onCopyToClipboard(starter.question)}
                    className="ml-2 p-1 hover:bg-white rounded"
                    title="Copy question"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Data Details */}
      {intelligence.stageData && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            Stage Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stage:</span>
                <span className="font-medium capitalize">{intelligence.stageData.currentStage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time in Stage:</span>
                <span className={`font-medium ${
                  intelligence.stageData.isOverdue ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {intelligence.stageData.timeInStage}
                </span>
              </div>
              {intelligence.stageData.isOverdue && (
                <div className="text-red-600 text-sm flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Stage duration is above average
                </div>
              )}
            </div>
            <div className="space-y-2">
              {intelligence.stageData.nextStageProbability && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Stage Probability:</span>
                  <span className="font-medium">{intelligence.stageData.nextStageProbability}%</span>
                </div>
              )}
              {intelligence.stageData.estimatedDaysToNextStage && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Days to Next Stage:</span>
                  <span className="font-medium">{intelligence.stageData.estimatedDaysToNextStage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Analysis Metadata</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Generated:</span>
            <span className="ml-2 text-gray-900">
              {intelligence.generatedAt ? new Date(intelligence.generatedAt).toLocaleString() : 'Unknown'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Version:</span>
            <span className="ml-2 text-gray-900">{intelligence.processingVersion || 'Unknown'}</span>
          </div>
          {intelligence.dataQuality && (
            <div>
              <span className="text-gray-600">Data Quality:</span>
              <span className="ml-2 text-gray-900">{intelligence.dataQuality}%</span>
            </div>
          )}
          {intelligence.engagementLevel && (
            <div>
              <span className="text-gray-600">Engagement:</span>
              <span className="ml-2 text-gray-900 capitalize">{intelligence.engagementLevel}</span>
            </div>
          )}
          {intelligence.confidence && (
            <div>
              <span className="text-gray-600">Confidence Score:</span>
              <span className="ml-2 text-gray-900">{intelligence.confidence}%</span>
            </div>
          )}
          {intelligence.momentumSignals && intelligence.momentumSignals.length > 0 && (
            <div>
              <span className="text-gray-600">Momentum Signals:</span>
              <span className="ml-2 text-gray-900">{intelligence.momentumSignals.length} detected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;