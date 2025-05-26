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
  Shield
} from 'lucide-react';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, className = "" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = (percentage) => {
    if (percentage >= 80) return '#10B981'; // green
    if (percentage >= 60) return '#3B82F6'; // blue  
    if (percentage >= 40) return '#F59E0B'; // amber
    return '#EF4444'; // red
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
          <div className="text-xs text-gray-500">Success</div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Deal Stage Progress Component
const DealStageProgress = ({ stageData }) => {
  const stages = [
    { key: 'prospecting', label: 'Prospecting', icon: Users },
    { key: 'qualified', label: 'Qualified', icon: CheckCircle },
    { key: 'proposal', label: 'Proposal', icon: FileText },
    { key: 'negotiation', label: 'Negotiation', icon: Activity },
    { key: 'closed_won', label: 'Closed', icon: Award }
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
        <Target className="h-4 w-4 mr-2 text-blue-600" />
        Deal Stage Progress
      </h3>
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = stageData?.completedStages?.includes(stage.key);
          const isCurrent = stageData?.currentStage === stage.key;
          const IconComponent = stage.icon;
          
          return (
            <div key={stage.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                    : 'bg-white border-gray-300 text-gray-400'
              }`}>
                <IconComponent className="h-5 w-5" />
              </div>
              
              <div className="ml-4 flex-1">
                <div className={`font-medium ${
                  isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {stage.label}
                </div>
                {isCurrent && (
                  <div className="text-xs text-blue-600 mt-1">Current Stage</div>
                )}
              </div>
              
              {index < stages.length - 1 && (
                <div className={`w-px h-8 ml-5 ${
                  isCompleted ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Factor Card Component
const FactorCard = ({ factor, type, index }) => {
  const isPositive = type === 'positive';
  
  return (
    <div className={`bg-white border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
      isPositive ? 'border-green-500' : 'border-red-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${
            isPositive ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isPositive ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-gray-800 font-medium">{factor.description}</p>
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-500">Impact:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isPositive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${factor.impact}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {factor.impact}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Requirement Card Component
const RequirementCard = ({ requirement, index }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{requirement.title}</h4>
          <p className="text-gray-600 text-sm leading-relaxed">{requirement.description}</p>
        </div>
      </div>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation, index, priority = 'medium' }) => {
  const safeString = (value, fallback = '') => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return value.title || value.description || value.name || String(value);
    }
    return fallback;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-50 to-orange-50 border-red-200';
      case 'low': return 'from-gray-50 to-slate-50 border-gray-200';
      default: return 'from-amber-50 to-yellow-50 border-amber-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'low': return <Lightbulb className="h-5 w-5 text-gray-600" />;
      default: return <Zap className="h-5 w-5 text-amber-600" />;
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getPriorityColor(priority)} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-white rounded-full shadow-sm">
          {getPriorityIcon(priority)}
        </div>
        <div className="flex-1">
          <div className="text-gray-800 leading-relaxed">
            {typeof recommendation === 'string' ? (
              recommendation
            ) : recommendation.title ? (
              <>
                <span className="font-semibold">{recommendation.title}</span>
                {recommendation.description && (
                  <span className="text-gray-600">: {recommendation.description}</span>
                )}
              </>
            ) : (
              safeString(recommendation)
            )}
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
		
		// Use the existing summary route
		const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
		
		// Debug logging
		console.log('Full response:', response.data);
		console.log('Deal intelligence:', response.data.dealIntelligence);
		
		// Extract deal intelligence
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

  // Load data on component mount
  useEffect(() => {
    if (clientId && userId) {
      fetchDealIntelligence();
    }
  }, [clientId, userId]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Render loading state with skeleton
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
        
        {/* Skeleton Loading */}
        <div className="space-y-4">
          <div className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
          <div className="bg-gray-200 animate-pulse rounded-xl h-24"></div>
          <div className="bg-gray-200 animate-pulse rounded-xl h-16"></div>
        </div>
      </div>
    );
  }

  // Render error state
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

  // Render not available state
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

  // Handle message-only cases (no deals or closed deals)
  if (intelligence.message) {
    return (
      <div className="p-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-blue-800 mb-3">
            {intelligence.hasDeals === false ? 'No Active Deals Found' : 'Deals Status Update'}
          </h3>
          <p className="text-blue-700 mb-6 leading-relaxed">{intelligence.message}</p>
          
          {intelligence.recommendations && intelligence.recommendations.length > 0 && (
            <div className="bg-white rounded-xl p-6 text-left">
              <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                Strategic Recommendations
              </h4>
              <div className="space-y-3">
                {intelligence.recommendations.map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} index={index} priority="medium" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section - Deal Health Dashboard */}
      <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Deal Score Visualization */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center">
            <CircularProgress percentage={intelligence.dealScore} />
            <p className="text-sm text-gray-600 mt-2 text-center">Deal Success Probability</p>
          </div>
          
          {/* Key Metrics */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal Intelligence Overview</h2>
              <p className="text-gray-600 leading-relaxed">{intelligence.reasoning}</p>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Deal Health</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {intelligence.dealScore >= 80 ? 'Excellent' : 
                   intelligence.dealScore >= 60 ? 'Good' : 
                   intelligence.dealScore >= 40 ? 'Fair' : 'Needs Attention'}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Current Stage</span>
                </div>
                <div className="text-xl font-bold text-gray-900 capitalize">
                  {intelligence.stageData?.currentStage?.replace('_', ' ') || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Stage Progress */}
      {intelligence.stageData && (
        <DealStageProgress stageData={intelligence.stageData} />
      )}

      {/* Success Factors Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('factors')}
          className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center">
            {expandedSection === 'factors' ? (
              <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
            )}
            <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-800">Success Factors Analysis</h3>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700 font-medium">{intelligence.factors?.positive?.length || 0} Positive</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-red-700 font-medium">{intelligence.factors?.negative?.length || 0} Risk</span>
            </div>
          </div>
        </button>
        
        {expandedSection === 'factors' && (
          <div className="px-6 pb-6 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Positive Factors */}
              {intelligence.factors?.positive?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Success Drivers
                  </h4>
                  <div className="space-y-3">
                    {intelligence.factors.positive.map((factor, index) => (
                      <FactorCard key={index} factor={factor} type="positive" index={index} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Negative Factors */}
              {intelligence.factors?.negative?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2" />
                    Risk Factors
                  </h4>
                  <div className="space-y-3">
                    {intelligence.factors.negative.map((factor, index) => (
                      <FactorCard key={index} factor={factor} type="negative" index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Requirements Section */}
      {intelligence.requirements?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('requirements')}
            className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              {expandedSection === 'requirements' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
              )}
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Customer Requirements</h3>
            </div>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {intelligence.requirements.length} Requirements
            </span>
          </button>
          
          {expandedSection === 'requirements' && (
            <div className="px-6 pb-6 bg-gray-50">
              <div className="grid gap-4">
                {intelligence.requirements.map((req, index) => (
                  <RequirementCard key={index} requirement={req} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Stage Section */}
      {intelligence.nextStage && Object.keys(intelligence.nextStage).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('nextStage')}
            className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              {expandedSection === 'nextStage' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
              )}
              <ArrowRight className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Path to Next Stage</h3>
            </div>
            <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{intelligence.nextStage.timeframe}</span>
            </div>
          </button>
          
          {expandedSection === 'nextStage' && (
            <div className="px-6 pb-6 bg-gray-50">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Potential Value</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{intelligence.nextStage.value}</div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <Target className="h-6 w-6 text-green-600 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Success Probability</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {intelligence.stageData?.nextStageLikelihood || 'Unknown'}%
                  </div>
                </div>
              </div>
              
              {intelligence.nextStage.blockers && intelligence.nextStage.blockers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Potential Blockers
                  </h4>
                  <div className="space-y-3">
                    {intelligence.nextStage.blockers.map((blocker, index) => (
                      <div key={index} className="flex items-start bg-white rounded-lg p-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{blocker}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Section */}
      {intelligence.recommendations?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('recommendations')}
            className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              {expandedSection === 'recommendations' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-3" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
              )}
              <Star className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="font-semibold text-gray-800">Strategic Recommendations</h3>
            </div>
            <span className="bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
              {intelligence.recommendations.length} Actions
            </span>
          </button>
          
          {expandedSection === 'recommendations' && (
            <div className="px-6 pb-6 bg-gray-50">
              <div className="space-y-4">
                {intelligence.recommendations.map((rec, index) => (
                  <RecommendationCard 
                    key={index} 
                    recommendation={rec} 
                    index={index} 
                    priority={index < 2 ? 'high' : index < 4 ? 'medium' : 'low'} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DealIntelligenceTab;