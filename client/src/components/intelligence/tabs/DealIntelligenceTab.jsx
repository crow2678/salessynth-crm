import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  Calendar,
  Target,
  Award,
  BarChart3,
  Activity,
  ArrowRight,
  Star,
  AlertCircle,
  Lightbulb,
  Timer,
  DollarSign,
  Users,
  FileText,
  Shield,
  MessageCircle,
  Phone,
  Mail,
  Rocket,
  Eye,
  Brain,
  TrendingUp as Growth,
  Gauge
} from 'lucide-react';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

// Enhanced Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, className = "" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = (percentage) => {
    if (percentage >= 70) return '#10B981'; // green
    if (percentage >= 50) return '#3B82F6'; // blue  
    if (percentage >= 30) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const getLabel = (percentage) => {
    if (percentage >= 70) return 'High';
    if (percentage >= 50) return 'Medium';
    if (percentage >= 30) return 'Low';
    return 'Critical';
  };

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
          <div className="text-xs text-gray-500">{getLabel(percentage)}</div>
        </div>
      </div>
    </div>
  );
};

// Risk Factor Component
const RiskFactorCard = ({ risk, index }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'low': return <Clock className="h-5 w-5 text-blue-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${getSeverityColor(risk.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-white rounded-full shadow-sm">
            {getSeverityIcon(risk.severity)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 capitalize">{risk.type} Risk</h4>
            <p className="text-gray-700 mt-1">{risk.description}</p>
            {risk.recommendation && (
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 font-medium">Recommendation:</p>
                <p className="text-sm text-gray-800 mt-1">{risk.recommendation}</p>
              </div>
            )}
            {risk.impact && (
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-gray-500 mr-2">Impact:</span>
                <span className="text-sm font-semibold text-red-600">{risk.impact}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Opportunity Component
const OpportunityCard = ({ opportunity, index }) => {
  const getPotentialColor = (potential) => {
    switch (potential) {
      case 'high': return 'border-green-500 bg-green-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${getPotentialColor(opportunity.potential)}`}>
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-white rounded-full shadow-sm">
          <Rocket className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">Opportunity</h4>
          <p className="text-gray-700 mt-1">{opportunity.opportunity}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-2 border">
              <p className="text-xs text-gray-500">Potential</p>
              <p className="font-semibold capitalize text-green-600">{opportunity.potential}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border">
              <p className="text-xs text-gray-500">Timeline</p>
              <p className="font-semibold text-blue-600">{opportunity.timeline}</p>
            </div>
          </div>
          {opportunity.action && (
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <p className="text-sm text-gray-600 font-medium">Recommended Action:</p>
              <p className="text-sm text-gray-800 mt-1">{opportunity.action}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Next Action Component
const NextActionCard = ({ action, index }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'medium': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'low': return <Calendar className="h-5 w-5 text-blue-600" />;
      default: return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${getPriorityColor(action.priority)}`}>
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-white rounded-full shadow-sm">
          {getPriorityIcon(action.priority)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-800">{action.action}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
              action.priority === 'high' ? 'bg-red-100 text-red-800' :
              action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {action.priority}
            </span>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-2 border">
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="font-semibold text-gray-800">{action.deadline}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border">
              <p className="text-xs text-gray-500">Expected Outcome</p>
              <p className="text-sm text-gray-700">{action.expectedOutcome}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// Conversation Starter Component
const ConversationCard = ({ conversation, index }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-purple-100 rounded-full">
          <MessageCircle className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{conversation.topic}</h4>
          <div className="mt-2 p-3 bg-white rounded-lg border">
            <p className="text-sm text-gray-600 font-medium">Question:</p>
            <p className="text-gray-800 mt-1 italic">"{conversation.question}"</p>
          </div>
          <div className="mt-2 p-2 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700 font-medium">Purpose:</p>
            <p className="text-xs text-purple-800">{conversation.purpose}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Key Insight Component
const InsightCard = ({ insight, index }) => {
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'border-green-500 bg-green-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${getImpactColor(insight.impact)}`}>
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-white rounded-full shadow-sm">
          <Brain className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <p className="text-gray-800 font-medium">{insight.insight}</p>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                insight.impact === 'high' ? 'bg-green-100 text-green-800' :
                insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {insight.impact} impact
              </span>
              {insight.actionRequired && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  Action Required
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DealIntelligenceTab = ({ clientId, userId }) => {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState('overview');

  // Function to fetch deal intelligence data
  const fetchDealIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
      
      console.log('Full response:', response.data);
      console.log('Deal intelligence:', response.data.dealIntelligence);
      
      if (response.data && response.data.dealIntelligence) {
        setIntelligence(response.data.dealIntelligence);
      } else {
        setError('No deal intelligence available');
      }
    } catch (err) {
      console.error('Error fetching deal intelligence:', err);
      setError(err.response?.data?.message || 'Failed to load deal intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && userId) {
      fetchDealIntelligence();
    }
  }, [clientId, userId]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Analyzing deal intelligence...</p>
            <p className="text-gray-400 text-sm mt-1">This may take a few moments</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
          <div className="bg-gray-200 animate-pulse rounded-xl h-24"></div>
          <div className="bg-gray-200 animate-pulse rounded-xl h-16"></div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Deal Intelligence</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDealIntelligence}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No Data State
  if (!intelligence) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Deal Intelligence Coming Soon</h3>
          <p className="text-blue-600 mb-4">We're analyzing your deal data to provide actionable insights.</p>
          <div className="bg-white rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-gray-600">Intelligence will include:</p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
              <div>• Success probability</div>
              <div>• Risk factors</div>
              <div>• Next actions</div>
              <div>• Stage progression</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section - Enhanced Deal Overview */}
      <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Deal Score Visualization */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center">
            <CircularProgress percentage={intelligence.dealScore || 0} />
            <p className="text-sm text-gray-600 mt-2 text-center">Deal Success Probability</p>
            {intelligence.confidence && (
              <div className="mt-2 flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">Confidence: {intelligence.confidence}%</span>
              </div>
            )}
          </div>
          
          {/* Key Metrics */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal Intelligence Overview</h2>
              <p className="text-gray-600 leading-relaxed">{intelligence.reasoning}</p>
            </div>
            
            {/* Enhanced Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Stage</span>
                </div>
                <div className="text-lg font-bold text-gray-900 capitalize">
                  {intelligence.currentStage || 'Unknown'}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Momentum</span>
                </div>
                <div className="text-lg font-bold text-gray-900 capitalize">
                  {intelligence.momentum || 'Steady'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Engagement</span>
                </div>
                <div className="text-lg font-bold text-gray-900 capitalize">
                  {intelligence.engagementLevel || 'Medium'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
	  {/* Key Insights Section */}
      {intelligence.keyInsights && intelligence.keyInsights.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('insights')}
            className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              {expandedSection === 'insights' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
              )}
              <Brain className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Key Insights</h3>
            </div>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {intelligence.keyInsights.length} Insights
            </span>
          </button>
          
          {expandedSection === 'insights' && (
            <div className="px-6 pb-6 bg-gray-50">
              <div className="space-y-4">
                {intelligence.keyInsights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Factors Section */}
      {intelligence.riskFactors && intelligence.riskFactors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('risks')}
            className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              {expandedSection === 'risks' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
              )}
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Risk Factors</h3>
            </div>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
              {intelligence.riskFactors.length} Risks
            </span>
          </button>
          
          {expandedSection === 'risks' && (
            <div className="px-6 pb-6 bg-gray-50">
              <div className="space-y-4">
                {intelligence.riskFactors.map((risk, index) => (
                  <RiskFactorCard key={index} risk={risk} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Opportunities Section */}
      {intelligence.opportunities && intelligence.opportunities.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('opportunities')}
            className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              {expandedSection === 'opportunities' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
              )}
              <Rocket className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Opportunities</h3>
            </div>
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
              {intelligence.opportunities.length} Opportunities
            </span>
          </button>
          
          {expandedSection === 'opportunities' && (
            <div className="px-6 pb-6 bg-gray-50">
              <div className="space-y-4">
                {intelligence.opportunities.map((opportunity, index) => (
                  <OpportunityCard key={index} opportunity={opportunity} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Actions Section */}
      {intelligence.nextActions && intelligence.nextActions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('actions')}
            className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              {expandedSection === 'actions' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
              )}
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Next Actions</h3>
            </div>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {intelligence.nextActions.length} Actions
            </span>
          </button>
          
          {expandedSection === 'actions' && (
            <div className="px-6 pb-6 bg-gray-50">
              <div className="space-y-4">
                {intelligence.nextActions.map((action, index) => (
                  <NextActionCard key={index} action={action} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversation Starters Section */}
      {intelligence.conversationStarters && intelligence.conversationStarters.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('conversations')}
            className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              {expandedSection === 'conversations' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
              )}
              <MessageCircle className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Conversation Starters</h3>
            </div>
            <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
              {intelligence.conversationStarters.length} Topics
            </span>
          </button>
          
          {expandedSection === 'conversations' && (
            <div className="px-6 pb-6 bg-gray-50">
              <div className="space-y-4">
                {intelligence.conversationStarters.map((conversation, index) => (
                  <ConversationCard key={index} conversation={conversation} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Industry Benchmark Section */}
      {intelligence.industryBenchmark && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Industry Benchmark
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600">Typical Stage Length</p>
              <p className="text-xl font-bold text-indigo-700">{intelligence.industryBenchmark.typicalStageLength}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600">Success Probability</p>
              <p className="text-xl font-bold text-indigo-700">{intelligence.industryBenchmark.successProbability}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600">Performance vs Industry</p>
              <p className="text-xl font-bold text-indigo-700 capitalize">{intelligence.industryBenchmark.comparison}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stage Data Section */}
      {intelligence.stageData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Stage Analysis
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600">Current Stage</p>
              <p className="text-lg font-bold text-green-700 capitalize">{intelligence.stageData.currentStage}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600">Time in Stage</p>
              <p className="text-lg font-bold text-green-700">{intelligence.stageData.timeInStage || 'Unknown'}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className={`text-lg font-bold ${intelligence.stageData.isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                {intelligence.stageData.isOverdue ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600">Next Stage Probability</p>
              <p className="text-lg font-bold text-green-700">
                {intelligence.stageData.nextStageProbability ? `${intelligence.stageData.nextStageProbability}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality & Processing Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {intelligence.dataQuality && (
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Data Quality: {intelligence.dataQuality}%</span>
              </div>
            )}
            {intelligence.processingVersion && (
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI Version: {intelligence.processingVersion}</span>
              </div>
            )}
          </div>
          {intelligence.generatedAt && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Generated: {new Date(intelligence.generatedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealIntelligenceTab;