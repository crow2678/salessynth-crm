// DashboardTab.jsx - Executive Summary Smart Dashboard Component
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  Copy,
  Target,
  Zap,
  Shield,
  Lightbulb,
  ArrowRight,
  Info,
  Star,
  DollarSign,
  Calendar,
  MessageSquare
} from 'lucide-react';

/**
 * Executive Dashboard Tab - Provides 10-second deal intelligence overview
 * Designed for maximum impact with minimal cognitive load
 */
const DashboardTab = ({ intelligence, clientName, onCopyToClipboard }) => {
  // Loading state
  if (!intelligence) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating smart insights...</p>
          <p className="text-sm text-gray-500 mt-2">Analyzing deal patterns and momentum</p>
        </div>
      </div>
    );
  }
  
  // Handle edge cases (no deals, closed deals)
  if (intelligence.message) {
    return <NoActiveDealsCard intelligence={intelligence} />;
  }
  
  // Extract key metrics
  const dealScore = intelligence.dealScore || 50;
  const momentum = intelligence.momentum || 'steady';
  const confidence = intelligence.confidence || 50;
  const currentStage = intelligence.currentStage || 'unknown';
  
  return (
    <div className="space-y-6">
      {/* Hero Card - Deal Health at a Glance */}
      <DealHealthCard 
        dealScore={dealScore}
        momentum={momentum}
        confidence={confidence}
        currentStage={currentStage}
        intelligence={intelligence}
      />
      
      {/* Action Grid - Quick Decision Making */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PriorityActionsCard intelligence={intelligence} />
        <RiskAlertsCard intelligence={intelligence} />
      </div>
      
      {/* Intelligence Grid - Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KeyInsightsCard intelligence={intelligence} />
        <OpportunitiesCard intelligence={intelligence} />
      </div>
      
      {/* Smart Conversation Tools */}
      {intelligence.conversationStarters && intelligence.conversationStarters.length > 0 && (
        <ConversationStartersCard 
          conversationStarters={intelligence.conversationStarters}
          onCopyToClipboard={onCopyToClipboard}
        />
      )}
      
      {/* Performance Benchmarks */}
      {intelligence.industryBenchmark && (
        <BenchmarkCard benchmark={intelligence.industryBenchmark} intelligence={intelligence} />
      )}
      
      {/* Bottom Line Summary */}
      <ExecutiveSummaryCard intelligence={intelligence} dealScore={dealScore} />
    </div>
  );
};

/**
 * Deal Health Hero Card - Primary visual indicator
 */
const DealHealthCard = ({ dealScore, momentum, confidence, currentStage, intelligence }) => {
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  const getMomentumIcon = (momentum) => {
    switch (momentum) {
      case 'accelerating': return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'declining': return <TrendingDown className="w-6 h-6 text-red-500" />;
      case 'stalling': return <Minus className="w-6 h-6 text-yellow-500" />;
      default: return <Minus className="w-6 h-6 text-blue-500" />;
    }
  };
  
  const getMomentumDescription = (momentum) => {
    switch (momentum) {
      case 'accelerating': return 'Strong positive signals';
      case 'declining': return 'Multiple risk indicators';
      case 'stalling': return 'Progress has slowed';
      default: return 'Steady progression';
    }
  };
  
  const healthColor = getHealthColor(dealScore);
  const momentumIcon = getMomentumIcon(momentum);
  const momentumDesc = getMomentumDescription(momentum);
  
  return (
    <div className={`p-6 rounded-xl border-2 ${healthColor} relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-transparent"></div>
      </div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/50 rounded-lg">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Deal Health Score</h3>
              <p className="text-sm opacity-75">AI-powered deal assessment</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white/20 px-4 py-2 rounded-lg">
            {momentumIcon}
            <div className="text-right">
              <div className="font-semibold capitalize">{momentum}</div>
              <div className="text-xs opacity-75">{momentumDesc}</div>
            </div>
          </div>
        </div>
        
        {/* Main Score Display */}
        <div className="flex items-end space-x-6 mb-6">
          <div className="text-7xl font-black leading-none">{dealScore}%</div>
          <div className="pb-3 space-y-1">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span className="font-medium">Confidence: {confidence}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Stage: {currentStage}</span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold">
              {intelligence.stageData?.timeInStage || 'Unknown'}
            </div>
            <div className="text-xs opacity-75">Time in Stage</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {intelligence.industryBenchmark?.successProbability || 'N/A'}
            </div>
            <div className="text-xs opacity-75">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {intelligence.riskFactors?.length || 0}
            </div>
            <div className="text-xs opacity-75">Risk Factors</div>
          </div>
        </div>
        
        {/* AI Analysis Summary */}
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-sm leading-relaxed">
            {intelligence.reasoning || 'Deal analysis based on current stage, momentum indicators, and engagement patterns.'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Priority Actions Card - What to do next
 */
const PriorityActionsCard = ({ intelligence }) => {
  const priorityActions = intelligence.nextActions?.slice(0, 3) || [];
  
  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-1 bg-orange-100 rounded">
          <Zap className="w-5 h-5 text-orange-600" />
        </div>
        <h4 className="font-bold text-gray-900">Do This Next</h4>
        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
          {priorityActions.length} actions
        </span>
      </div>
      
      <div className="space-y-3">
        {priorityActions.length > 0 ? (
          priorityActions.map((action, index) => (
            <ActionItem key={index} action={action} index={index} />
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No specific actions identified</p>
            <p className="text-xs">Continue regular follow-up activities</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual Action Item Component
 */
const ActionItem = ({ action, index }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-yellow-400';
      default: return 'bg-green-400';
    }
  };
  
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      default: return '✅';
    }
  };
  
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(action.priority)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-sm text-gray-900 mb-1">
              {getPriorityIcon(action.priority)} {action.action}
            </p>
            <p className="text-xs text-gray-600 mb-2">{action.expectedOutcome}</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {action.deadline}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                action.priority === 'high' ? 'bg-red-100 text-red-700' :
                action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {action.priority}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Risk Alerts Card - What could go wrong
 */
const RiskAlertsCard = ({ intelligence }) => {
  const riskFactors = intelligence.riskFactors?.slice(0, 3) || [];
  const hasHighRisk = riskFactors.some(risk => risk.severity === 'high');
  
  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <div className={`p-1 rounded ${hasHighRisk ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <Shield className={`w-5 h-5 ${hasHighRisk ? 'text-red-600' : 'text-yellow-600'}`} />
        </div>
        <h4 className="font-bold text-gray-900">Risk Monitor</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          hasHighRisk ? 'bg-red-100 text-red-700' :
          riskFactors.length > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        }`}>
          {riskFactors.length > 0 ? `${riskFactors.length} risks` : 'Low risk'}
        </span>
      </div>
      
      <div className="space-y-3">
        {riskFactors.length > 0 ? (
          riskFactors.map((risk, index) => (
            <RiskItem key={index} risk={risk} />
          ))
        ) : (
          <div className="text-center py-4 text-green-600">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">All Clear</p>
            <p className="text-xs text-gray-500">No major risks detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual Risk Item Component
 */
const RiskItem = ({ risk }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };
  
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      default: return 'ℹ️';
    }
  };
  
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getSeverityColor(risk.severity)}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 mb-1">
          {getSeverityIcon(risk.severity)} {risk.risk}
        </p>
        <p className="text-xs text-gray-600 mb-2">{risk.mitigation}</p>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            risk.severity === 'high' ? 'bg-red-100 text-red-700' :
            risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {risk.severity} priority
          </span>
          {risk.timeline && (
            <span className="text-xs text-gray-500">{risk.timeline}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Key Insights Card - What's important
 */
const KeyInsightsCard = ({ intelligence }) => {
  const insights = intelligence.keyInsights?.slice(0, 3) || [];
  
  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-1 bg-blue-100 rounded">
          <Lightbulb className="w-5 h-5 text-blue-600" />
        </div>
        <h4 className="font-bold text-gray-900">Key Insights</h4>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          AI-powered
        </span>
      </div>
      
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No specific insights available</p>
            <p className="text-xs">Continue gathering client information</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual Insight Item Component
 */
const InsightItem = ({ insight }) => {
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-yellow-400';
      default: return 'bg-green-400';
    }
  };
  
  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return '💡';
      case 'medium': return '💭';
      default: return '📝';
    }
  };
  
  return (
    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getImpactColor(insight.impact)}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 mb-2">
          {getImpactIcon(insight.impact)} {insight.insight}
        </p>
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            insight.impact === 'high' ? 'bg-red-100 text-red-700' :
            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {insight.impact} impact
          </span>
          {insight.actionRequired && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Opportunities Card - Where to focus
 */
const OpportunitiesCard = ({ intelligence }) => {
  const opportunities = intelligence.opportunities?.slice(0, 3) || [];
  
  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-1 bg-green-100 rounded">
          <Target className="w-5 h-5 text-green-600" />
        </div>
        <h4 className="font-bold text-gray-900">Opportunities</h4>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          {opportunities.length} identified
        </span>
      </div>
      
      <div className="space-y-3">
        {opportunities.length > 0 ? (
          opportunities.map((opportunity, index) => (
            <OpportunityItem key={index} opportunity={opportunity} />
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No specific opportunities identified</p>
            <p className="text-xs">Focus on current deal progression</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual Opportunity Item Component
 */
const OpportunityItem = ({ opportunity }) => {
  const getPotentialColor = (potential) => {
    switch (potential) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };
  
  const getPotentialIcon = (potential) => {
    switch (potential) {
      case 'high': return '🚀';
      case 'medium': return '📈';
      default: return '💼';
    }
  };
  
  return (
    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
      <ArrowRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getPotentialColor(opportunity.potential)}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 mb-1">
          {getPotentialIcon(opportunity.potential)} {opportunity.opportunity}
        </p>
        <p className="text-xs text-gray-600 mb-2">{opportunity.action}</p>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            opportunity.potential === 'high' ? 'bg-green-100 text-green-700' :
            opportunity.potential === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {opportunity.potential} potential
          </span>
          {opportunity.timeline && (
            <span className="text-xs text-gray-500">{opportunity.timeline}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Conversation Starters Card - Smart questions to ask
 */
const ConversationStartersCard = ({ conversationStarters, onCopyToClipboard }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-lg border border-purple-200">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-1 bg-purple-100 rounded">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <h4 className="font-bold text-purple-900">Smart Conversation Starters</h4>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
          AI-generated
        </span>
      </div>
      
      <div className="space-y-4">
        {conversationStarters.slice(0, 2).map((starter, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-purple-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    {starter.topic}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  "{starter.question}"
                </p>
                <p className="text-xs text-gray-600">{starter.purpose}</p>
              </div>
              <button
                onClick={() => onCopyToClipboard && onCopyToClipboard(starter.question)}
                className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Copy question"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Benchmark Card - Industry comparison
 */
const BenchmarkCard = ({ benchmark, intelligence }) => {
  const getComparisonColor = (comparison) => {
    switch (comparison) {
      case 'above average': return 'text-red-600';
      case 'below average': return 'text-green-600';
      default: return 'text-gray-900';
    }
  };
  
  const getComparisonIcon = (comparison) => {
    switch (comparison) {
      case 'above average': return '⚠️';
      case 'below average': return '✅';
      default: return '📊';
    }
  };
  
  return (
    <div className="bg-gray-50 p-5 rounded-lg border">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-1 bg-gray-200 rounded">
          <Info className="w-5 h-5 text-gray-600" />
        </div>
        <h4 className="font-bold text-gray-900">Industry Benchmark</h4>
        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
          Market data
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {benchmark.typicalStageLength}
          </div>
          <div className="text-xs text-gray-600">Typical Duration</div>
          <div className="text-xs text-gray-500 mt-1">
            Your deal: {intelligence.stageData?.timeInStage || 'Unknown'}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {benchmark.successProbability}
          </div>
          <div className="text-xs text-gray-600">Success Rate</div>
          <div className="text-xs text-gray-500 mt-1">
            At this stage
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg">
          <div className={`text-lg font-bold mb-1 ${getComparisonColor(benchmark.comparison)}`}>
            {getComparisonIcon(benchmark.comparison)} {benchmark.comparison}
          </div>
          <div className="text-xs text-gray-600">vs Industry</div>
          <div className="text-xs text-gray-500 mt-1">
            Performance
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Executive Summary Card - Bottom line
 */
const ExecutiveSummaryCard = ({ intelligence, dealScore }) => {
  const getExecutiveRecommendation = (score, momentum, risks) => {
    if (score >= 80) {
      return {
        status: 'Excellent',
        icon: '🚀',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        recommendation: 'Deal is on track for success. Focus on closing activities and addressing any final concerns.'
      };
    } else if (score >= 60) {
      return {
        status: 'Good',
        icon: '✅',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        recommendation: 'Deal is progressing well. Continue current approach while monitoring key risk factors.'
      };
    } else if (score >= 40) {
      return {
        status: 'Needs Attention',
        icon: '⚠️',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        recommendation: 'Deal requires focused attention. Address identified risks and re-engage client actively.'
      };
    } else {
      return {
        status: 'At Risk',
        icon: '🚨',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        recommendation: 'Deal is in jeopardy. Immediate intervention required to salvage opportunity.'
      };
    }
  };
  
  const summary = getExecutiveRecommendation(
    dealScore, 
    intelligence.momentum, 
    intelligence.riskFactors?.length || 0
  );
  
  return (
    <div className={`p-5 rounded-lg border-2 ${summary.bgColor} ${summary.borderColor}`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-2xl">{summary.icon}</div>
        <div>
          <h4 className={`font-bold text-lg ${summary.color}`}>
            Executive Summary: {summary.status}
          </h4>
          <p className="text-sm text-gray-600">
            AI-powered assessment based on {intelligence.confidence || 50}% confidence
          </p>
        </div>
      </div>
      
      <p className={`text-sm leading-relaxed ${summary.color} font-medium`}>
        {summary.recommendation}
      </p>
      
      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-gray-900">{dealScore}%</div>
          <div className="text-xs text-gray-600">Health Score</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900 capitalize">{intelligence.momentum || 'Steady'}</div>
          <div className="text-xs text-gray-600">Momentum</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{intelligence.riskFactors?.length || 0}</div>
          <div className="text-xs text-gray-600">Risk Factors</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{intelligence.nextActions?.length || 0}</div>
          <div className="text-xs text-gray-600">Actions</div>
        </div>
      </div>
    </div>
  );
};

/**
 * No Active Deals Card - Handle edge case
 */
const NoActiveDealsCard = ({ intelligence }) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-3">No Active Deals</h3>
        <p className="text-gray-600 mb-4 max-w-md mx-auto leading-relaxed">
          {intelligence.message}
        </p>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          {intelligence.suggestion}
        </p>
        
        {intelligence.nextActions && intelligence.nextActions.length > 0 && (
          <div className="max-w-md mx-auto">
            <h4 className="font-semibold text-gray-900 mb-4">Recommended Next Steps:</h4>
            <div className="space-y-3">
              {intelligence.nextActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border text-left">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{action.action}</p>
                    <p className="text-xs text-gray-600 mt-1">{action.expectedOutcome}</p>
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
};

export default DashboardTab;