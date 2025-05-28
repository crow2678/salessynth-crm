// tabs/DashboardTab.jsx - Simplified Part 1: Core Components with Timeline
import React, { useState } from 'react';
import { 
  AlertTriangle,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  User,
  Building,
  DollarSign,
  Zap,
  AlertCircle,
  Users,
  MessageSquare,
  Star,
  Shield,
  PlayCircle,
  Briefcase,
  Eye
} from 'lucide-react';
import { GoogleNewsCard } from '../common/CommonComponents';
import { formatMarkdown } from '../utils/intelligenceUtils';

// Utility Functions
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return 'Invalid date';
  }
};

// HeaderWithMetrics - 4-Column Dynamic Layout (Simplified)
const HeaderWithMetrics = ({ displayName, dealValue, dealRisk, researchData }) => {
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Extract dynamic data
  const dealIntelligence = researchData?.dealIntelligence || {};
  const riskFactors = dealIntelligence.riskFactors || [];
  const nextActions = dealIntelligence.nextActions || [];
  const currentStage = dealIntelligence.currentStage || 'discovery';
  const timeInStage = dealIntelligence.stageData?.timeInStage || null;

  // Calculate metrics
  const criticalIssues = riskFactors.filter(risk => risk.severity === 'high').length;
  const allIssues = riskFactors.length;
  const pendingDecision = currentStage.replace('_', ' ').toUpperCase();
  const highPriorityActions = nextActions.filter(action => action.priority === 'high').length;
  const allActions = nextActions.length;
  
  // Dynamic labels
  const blockersLabel = criticalIssues > 0 ? 'Critical Issues' : (allIssues > 0 ? 'Issues Found' : 'No Issues');
  const actionsLabel = highPriorityActions > 0 ? 'High Priority' : (allActions > 0 ? 'Actions Pending' : 'No Actions');

  return (
    <div className="grid grid-cols-4 gap-4 mb-4">
      {/* Client Info */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <User className="h-4 w-4 text-gray-600 mr-2" />
          <span className="text-xs font-bold text-gray-800 uppercase">Client Deal</span>
        </div>
        <div className="text-lg font-bold text-gray-900 mb-1">
          {displayName || 'Unknown Client'}
        </div>
        <div className="text-sm text-gray-600 mb-2">
          {dealValue || 'Value TBD'}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getRiskColor(dealRisk)}`}>
          {dealRisk ? `${dealRisk.toUpperCase()} RISK` : 'ASSESSING'}
        </span>
      </div>

      {/* Deal Blockers - Simplified */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
          <span className="text-xs font-bold text-red-800 uppercase">Deal Blockers</span>
        </div>
        <div className="text-2xl font-bold text-red-700 mb-1">
          {criticalIssues > 0 ? criticalIssues : (allIssues > 0 ? allIssues : '0')}
        </div>
        <div className="text-sm text-red-600 font-medium">{blockersLabel}</div>
      </div>

      {/* Decision Pending - Simplified */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Clock className="h-4 w-4 text-amber-600 mr-2" />
          <span className="text-xs font-bold text-amber-800 uppercase">Decision Pending</span>
        </div>
        <div className="text-lg font-bold text-amber-700 mb-1">
          {pendingDecision}
        </div>
        <div className="text-sm text-amber-600 font-medium">Current Stage</div>
      </div>

      {/* Hot Actions - Simplified */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Zap className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-xs font-bold text-blue-800 uppercase">Hot Actions</span>
        </div>
        <div className="text-2xl font-bold text-blue-700 mb-1">
          {highPriorityActions > 0 ? highPriorityActions : (allActions > 0 ? allActions : '0')}
        </div>
        <div className="text-sm text-blue-600 font-medium">{actionsLabel}</div>
      </div>
    </div>
  );
};

// Deal Timeline Indicator - NEW Horizontal Component
const DealTimelineIndicator = ({ researchData }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const currentStage = dealIntelligence.currentStage || 'discovery';
  const timeInStage = dealIntelligence.stageData?.timeInStage || null;
  
  const stages = [
    { key: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
    { key: 'qualified', label: 'Qualified', color: 'bg-green-500' },
    { key: 'proposal', label: 'Proposal', color: 'bg-amber-500' },
    { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
    { key: 'closed_won', label: 'Closed', color: 'bg-green-600' }
  ];
  
  const currentStageIndex = stages.findIndex(stage => stage.key === currentStage);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">Deal Progress</h3>
        {timeInStage && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {timeInStage} in {toTitleCase(currentStage)}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            {/* Stage Circle */}
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                index <= currentStageIndex 
                  ? `${stage.color} border-transparent` 
                  : 'bg-gray-200 border-gray-300'
              }`}>
                {index < currentStageIndex && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
                {index === currentStageIndex && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${
                index <= currentStageIndex ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {stage.label}
              </span>
            </div>
            
            {/* Progress Line */}
            {index < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                index < currentStageIndex 
                  ? stage.color 
                  : 'bg-gray-200'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Enhanced Engagement Strategy - MOST IMPORTANT Component
const EngagementStrategy = ({ researchData }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const strategies = dealIntelligence.strategies || [];
  const objectionHandling = dealIntelligence.objectionHandling || [];
  const nextActions = dealIntelligence.nextActions || [];
  const hasSummary = researchData?.summary;
  
  // Extract strategy points from different sources
  let tailoredStrategies = strategies;
  let objectionPoints = objectionHandling;
  let actionableNext = nextActions.map(action => action.description || action.action || action).slice(0, 3);
  
  // Fallback to summary if no structured data
  if (tailoredStrategies.length === 0 && hasSummary) {
    const summaryPoints = researchData.summary
      .split(/[•\*\-]/)
      .filter(point => point.trim().length > 20)
      .map(point => point.trim().replace(/^\d+\.?\s*/, ''));
    
    tailoredStrategies = summaryPoints.slice(0, 3);
    objectionPoints = summaryPoints.slice(3, 6);
    actionableNext = summaryPoints.slice(6, 9);
  }
  
  if (tailoredStrategies.length === 0 && objectionPoints.length === 0 && actionableNext.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
          <Star className="h-5 w-5 text-purple-600 mr-2" />
          Engagement Strategy
        </h3>
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Generating tailored strategy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-bold text-gray-900 mb-6 flex items-center text-lg">
        <Star className="h-5 w-5 text-purple-600 mr-2" />
        Engagement Strategy
      </h3>
      
      <div className="space-y-6">
        {/* 1. TAILORED ENGAGEMENT STRATEGY */}
        {tailoredStrategies.length > 0 && (
          <div>
            <h4 className="font-semibold text-purple-900 mb-3 text-sm uppercase tracking-wide">
              Tailored Engagement Strategy
            </h4>
            <div className="space-y-2">
              {tailoredStrategies.map((strategy, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-purple-600 text-xs font-bold">{idx + 1}</span>
                  </div>
                  <span className="text-gray-700 leading-relaxed">{strategy}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. STRATEGIC OBJECTION HANDLING */}
        {objectionPoints.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-900 mb-3 text-sm uppercase tracking-wide">
              Strategic Objection Handling
            </h4>
            <div className="space-y-2">
              {objectionPoints.map((objection, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <span className="text-gray-700 leading-relaxed">{objection}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. NEXT ACTIONS */}
        {actionableNext.length > 0 && (
          <div>
            <h4 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide">
              Immediate Next Steps
            </h4>
            <div className="space-y-2">
              {actionableNext.map((action, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">→</span>
                  </div>
                  <span className="text-gray-700 leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// tabs/DashboardTab.jsx - Simplified Part 2: Final Components and Layout

// Company Intel Component - Compact Version
const CompanyIntel = ({ apolloData, googleData, researchData }) => {
  const companyInfo = apolloData?.company || {};
  const insights = apolloData?.insights || {};
  const dealIntelligence = researchData?.dealIntelligence || {};
  const companyInsights = dealIntelligence.companyInsights || {};
  const hasNews = googleData && googleData.length > 0;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Building className="h-4 w-4 text-blue-600 mr-2" />
        Company Intelligence
      </h3>
      
      <div className="space-y-3">
        {/* Company basics */}
        {(companyInfo.industry && companyInfo.industry !== 'Unknown') || 
         (companyInfo.size && companyInfo.size !== 'Unknown') || 
         companyInfo.revenue ? (
          <div className="text-sm space-y-1">
            {companyInfo.industry && companyInfo.industry !== 'Unknown' && (
              <div className="flex justify-between">
                <span className="text-gray-500">Industry:</span>
                <span className="font-medium">{toTitleCase(companyInfo.industry)}</span>
              </div>
            )}
            {companyInfo.size && companyInfo.size !== 'Unknown' && (
              <div className="flex justify-between">
                <span className="text-gray-500">Size:</span>
                <span className="font-medium">
                  {typeof companyInfo.size === 'number' ? `${companyInfo.size} employees` : companyInfo.size}
                </span>
              </div>
            )}
            {companyInfo.revenue && (
              <div className="flex justify-between">
                <span className="text-gray-500">Revenue:</span>
                <span className="font-medium">{companyInfo.revenue}</span>
              </div>
            )}
          </div>
        ) : null}
        
        {/* Business Model Insight */}
        {companyInsights.businessModel && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="flex items-start">
              <Briefcase className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-blue-800 uppercase">Business Model</div>
                <div className="text-sm text-blue-700">{companyInsights.businessModel}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Key Pain Point */}
        {companyInsights.painPoints && companyInsights.painPoints.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-amber-800 uppercase">Key Pain Point</div>
                <div className="text-sm text-amber-700">{companyInsights.painPoints[0]}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Buying Signal */}
        {insights.buyingSignals?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <div className="flex items-start">
              <Zap className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-green-800 uppercase">Buying Signal</div>
                <div className="text-sm text-green-700">{insights.buyingSignals[0]}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Recent News */}
        {hasNews && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="flex items-start">
              <MessageSquare className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-blue-800 uppercase">Recent News</div>
                <div className="text-sm text-blue-700 line-clamp-2">
                  {googleData[0].title}
                </div>
                {googleData[0].publishedDate && (
                  <div className="text-xs text-blue-500 mt-1">{formatDate(googleData[0].publishedDate)}</div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* No Data State */}
        {!companyInfo.industry && !companyInfo.size && !companyInsights.businessModel && 
         !companyInsights.painPoints?.length && !insights.buyingSignals?.length && !hasNews && (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">Gathering company intelligence...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Deal Playbook Component - Simplified
const DealPlaybook = ({ researchData, apolloData, pdlData }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const nextActions = dealIntelligence.nextActions || [];
  const completedMilestones = dealIntelligence.completedMilestones || [];
  const currentStage = dealIntelligence.currentStage || 'discovery';
  
  const generatePlaybookItems = () => {
    const items = [];
    
    // Add completed milestones
    completedMilestones.forEach(milestone => {
      items.push({
        status: 'completed',
        text: milestone.description || milestone,
        priority: 'normal'
      });
    });
    
    // Add standard completed items
    if (researchData?.summary) {
      items.push({ status: 'completed', text: 'AI analysis completed', priority: 'normal' });
    }
    if (apolloData?.company) {
      items.push({ status: 'completed', text: 'Company research done', priority: 'normal' });
    }
    if (apolloData?.keyPeople?.length > 0 || pdlData?.personData) {
      items.push({ status: 'completed', text: 'Contacts identified', priority: 'normal' });
    }
    
    // Add next actions
    nextActions.slice(0, 3).forEach(action => {
      items.push({
        status: 'pending',
        text: action.description || action.action || action,
        priority: action.priority || 'medium',
        isOverdue: action.isOverdue || false
      });
    });
    
    // Add default actions if none exist
    if (nextActions.length === 0) {
      const defaultActions = {
        'discovery': ['Schedule discovery call', 'Research decision makers'],
        'qualified': ['Technical presentation', 'Create business case'],
        'proposal': ['Deliver proposal', 'Address objections'],
        'negotiation': ['Review contract', 'Finalize terms']
      };
      
      const actions = defaultActions[currentStage] || defaultActions.discovery;
      actions.forEach(action => {
        items.push({
          status: 'pending',
          text: action,
          priority: 'high'
        });
      });
    }
    
    return items.slice(0, 8); // Limit to 8 items for compact display
  };

  const items = generatePlaybookItems();

  const getStatusIcon = (status, isOverdue = false) => {
    if (isOverdue) return <AlertTriangle className="h-3 w-3 text-red-600" />;
    
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending': return <Clock className="h-3 w-3 text-amber-600" />;
      default: return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <PlayCircle className="h-4 w-4 text-green-600 mr-2" />
        Deal Playbook
        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
          {items.filter(i => i.status === 'completed').length}/{items.length}
        </span>
      </h3>
      
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 text-sm">
            {getStatusIcon(item.status, item.isOverdue)}
            <span className={`flex-1 ${
              item.isOverdue ? 'text-red-700 font-medium' :
              item.status === 'completed' ? 'text-gray-600 line-through' : 
              item.priority === 'high' ? 'text-gray-900 font-medium' : 'text-gray-700'
            }`}>
              {item.text}
            </span>
            {item.priority === 'high' && item.status === 'pending' && !item.isOverdue && (
              <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                NEXT
              </span>
            )}
            {item.isOverdue && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                OVERDUE
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick Actions Component - Simplified
const QuickActions = ({ handleTabClick }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Zap className="h-4 w-4 text-blue-600 mr-2" />
        Quick Actions
      </h3>
      <div className="space-y-2">
        <button 
          onClick={() => handleTabClick('deal')}
          className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900 text-sm">Deal Analysis</div>
              <div className="text-xs text-blue-600">Success factors & risks</div>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-600" />
          </div>
        </button>
        
        <button 
          onClick={() => handleTabClick('company')}
          className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-green-900 text-sm">Company Profile</div>
              <div className="text-xs text-green-600">Detailed research</div>
            </div>
            <ArrowRight className="h-4 w-4 text-green-600" />
          </div>
        </button>
        
        <button 
          onClick={() => handleTabClick('profile')}
          className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-purple-900 text-sm">Contact Profiles</div>
              <div className="text-xs text-purple-600">Decision makers</div>
            </div>
            <ArrowRight className="h-4 w-4 text-purple-600" />
          </div>
        </button>
      </div>
    </div>
  );
};

// Main Simplified Dashboard Component - Option A Layout
const DashboardTab = ({ 
  researchData, 
  googleData, 
  apolloData, 
  pdlData, 
  displayName, 
  lastUpdated, 
  handleTabClick 
}) => {
  // Calculate deal metrics dynamically
  const dealIntelligence = researchData?.dealIntelligence || {};
  const dealScore = dealIntelligence.dealScore || 0;
  
  const dealValue = apolloData?.deals?.[0]?.value ? 
    `$${apolloData.deals[0].value.toLocaleString()}` : 
    dealIntelligence.dealValue || 
    null;
    
  const dealRisk = dealScore >= 70 ? 'low' : 
                  dealScore >= 40 ? 'medium' : 'high';

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header with 4-column metrics */}
      <HeaderWithMetrics 
        displayName={displayName}
        dealValue={dealValue}
        dealRisk={dealRisk}
        researchData={researchData}
      />
      
      {/* Deal Timeline Indicator */}
      <DealTimelineIndicator researchData={researchData} />
      
      {/* Main Content - Option A Layout: 70/30 split */}
      <div className="grid lg:grid-cols-10 gap-4">
        {/* Left Column - 70% width (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Engagement Strategy - Most Important, Full Width */}
          <EngagementStrategy researchData={researchData} />
          
          {/* Deal Playbook - Full Width */}
          <DealPlaybook 
            researchData={researchData}
            apolloData={apolloData}
            pdlData={pdlData}
          />
        </div>
        
        {/* Right Column - 30% width (3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Company Intel - Compact */}
          <CompanyIntel 
            apolloData={apolloData}
            googleData={googleData}
            researchData={researchData}
          />
          
          {/* Quick Actions */}
          <QuickActions handleTabClick={handleTabClick} />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;