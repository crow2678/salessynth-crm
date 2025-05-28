// tabs/DashboardTab.jsx - Complete Part 1: Imports, Utilities, and Core Components
import React, { useState } from 'react';
import { 
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Building,
  DollarSign,
  Zap,
  AlertCircle,
  Timer,
  Users,
  FileText,
  MessageSquare,
  Star,
  Shield,
  Activity,
  Bell,
  ChevronRight,
  PlayCircle,
  Briefcase,
  Eye,
  ThumbsUp,
  MapPin,
  Flame,
  CircleDollarSign
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

// HeaderWithMetrics - 4-Column Dynamic Layout
const HeaderWithMetrics = ({ displayName, dealValue, dealRisk, nextAction, researchData }) => {
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Extract ALL dynamic data from database
  const dealIntelligence = researchData?.dealIntelligence || {};
  const riskFactors = dealIntelligence.riskFactors || [];
  const nextActions = dealIntelligence.nextActions || [];
  const opportunities = dealIntelligence.opportunities || [];
  const timeInStage = dealIntelligence.stageData?.timeInStage || null;
  const currentStage = dealIntelligence.currentStage || null;
  const isOverdue = dealIntelligence.stageData?.isOverdue || false;
  const momentum = dealIntelligence.momentum || null;

  // Calculate metrics from real data - NO hardcoding
  const criticalIssues = riskFactors.filter(risk => risk.severity === 'high').length;
  const allIssues = riskFactors.length;
  const pendingDecision = currentStage ? currentStage.replace('_', ' ').toUpperCase() : 'UNKNOWN';
  const highPriorityActions = nextActions.filter(action => action.priority === 'high').length;
  const allActions = nextActions.length;
  const primaryAction = nextActions.length > 0 ? nextActions[0] : null;
  
  // Dynamic labels and descriptions
  const blockersLabel = criticalIssues > 0 ? 'Critical Issues' : (allIssues > 0 ? 'Issues Identified' : 'No Issues');
  const blockersSubtext = isOverdue && timeInStage ? `Overdue ${timeInStage}` : 
                         (timeInStage ? `In stage: ${timeInStage}` : 'Monitoring');
  
  const decisionLabel = currentStage ? 'Stage' : 'Status';
  const decisionSubtext = timeInStage ? `Duration: ${timeInStage}` : 'Timeline unknown';
  
  const actionsLabel = highPriorityActions > 0 ? 'High Priority' : (allActions > 0 ? 'Actions Pending' : 'No Actions');
  const actionsSubtext = primaryAction && primaryAction.deadline ? 
                        `Due: ${formatDate(primaryAction.deadline)}` : 
                        (nextActions.length > 0 ? 'Deadline pending' : 'No deadlines set');

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {/* Client Info Card - Fully Dynamic */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <User className="h-5 w-5 text-gray-600 mr-2" />
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Client Deal</span>
        </div>
        <div className="text-lg font-bold text-gray-900 mb-1">
          {displayName || 'Unknown Client'}
        </div>
        <div className="text-sm text-gray-600 font-medium mb-2">
          {dealValue || 'Value TBD'}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getRiskColor(dealRisk)}`}>
          {dealRisk ? `${dealRisk.toUpperCase()} RISK` : 'ASSESSING RISK'}
        </span>
      </div>

      {/* Deal Blockers - Fully Dynamic */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-xs font-bold text-red-800 uppercase tracking-wide">Deal Blockers</span>
        </div>
        <div className="text-2xl font-bold text-red-700 mb-1">
          {criticalIssues > 0 ? criticalIssues : (allIssues > 0 ? allIssues : '0')}
        </div>
        <div className="text-sm text-red-600 font-medium">{blockersLabel}</div>
        <div className="text-xs text-red-500 mt-1">{blockersSubtext}</div>
      </div>

      {/* Decision Pending - Fully Dynamic */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Clock className="h-5 w-5 text-amber-600 mr-2" />
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Decision Pending</span>
        </div>
        <div className="text-2xl font-bold text-amber-700 mb-1">
          {pendingDecision || 'UNKNOWN'}
        </div>
        <div className="text-sm text-amber-600 font-medium">{decisionLabel}</div>
        <div className="text-xs text-amber-500 mt-1">{decisionSubtext}</div>
      </div>

      {/* Hot Actions - Fully Dynamic */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Zap className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Hot Actions</span>
        </div>
        <div className="text-2xl font-bold text-blue-700 mb-1">
          {highPriorityActions > 0 ? highPriorityActions : (allActions > 0 ? allActions : '0')}
        </div>
        <div className="text-sm text-blue-600 font-medium">{actionsLabel}</div>
        <div className="text-xs text-blue-500 mt-1">{actionsSubtext}</div>
      </div>
    </div>
  );
};

// CompactDealHeader - Enhanced with Dynamic Data
const CompactDealHeader = ({ displayName, dealValue, dealRisk, nextAction, researchData }) => {
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Extract dynamic data from research
  const dealIntelligence = researchData?.dealIntelligence || {};
  const currentStage = dealIntelligence.currentStage || 'discovery';
  const momentum = dealIntelligence.momentum || 'steady';
  const dealScore = dealIntelligence.dealScore || null;
  
  // Use deal score if available, otherwise fallback to risk assessment
  const displayRisk = dealScore ? 
    (dealScore >= 70 ? 'LOW' : dealScore >= 40 ? 'MEDIUM' : 'HIGH') : 
    (dealRisk ? dealRisk.toUpperCase() : 'ASSESSING');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {toTitleCase(displayName)}{dealValue && ` - ${dealValue}`}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            <span className={`font-medium ${getRiskColor(dealRisk)}`}>
              {displayRisk} RISK
            </span>
            {dealScore && <span className="ml-3">• Score: {dealScore}%</span>}
            <span className="ml-3">• Stage: {toTitleCase(currentStage.replace('_', ' '))}</span>
            <span className="ml-3">• Momentum: {toTitleCase(momentum)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// CompactMetricCard - Enhanced with Additional Info
const CompactMetricCard = ({ title, value, subtitle, icon: IconComponent, color = 'blue', urgency = 'normal', additionalInfo = null }) => {
  const getBgColor = (color, urgency) => {
    if (urgency === 'urgent') return 'bg-red-50 border-red-200';
    const colors = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200', 
      amber: 'bg-amber-50 border-amber-200',
      red: 'bg-red-50 border-red-200'
    };
    return colors[color] || colors.blue;
  };

  const getTextColor = (color, urgency) => {
    if (urgency === 'urgent') return 'text-red-700';
    const colors = {
      blue: 'text-blue-700',
      green: 'text-green-700',
      amber: 'text-amber-700', 
      red: 'text-red-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={`border rounded-lg p-3 ${getBgColor(color, urgency)}`}>
      {urgency === 'urgent' && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block">
          URGENT
        </span>
      )}
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-xl font-bold ${getTextColor(color, urgency)}`}>
            {value}
          </div>
          <div className="text-xs font-medium text-gray-700 uppercase">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-600 mt-0.5">
              {subtitle}
            </div>
          )}
          {additionalInfo && (
            <div className="text-xs text-gray-500 mt-0.5">
              {additionalInfo}
            </div>
          )}
        </div>
        <IconComponent className={`h-5 w-5 ${getTextColor(color, urgency).replace('text-', 'text-').replace('-700', '-600')}`} />
      </div>
    </div>
  );
};
// tabs/DashboardTab.jsx - Complete Part 2: Strategy and Intelligence Components

// Engagement Strategy Component - Enhanced and Fully Dynamic
const EngagementStrategy = ({ researchData }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const strategies = dealIntelligence.strategies || [];
  const nextActions = dealIntelligence.nextActions || [];
  const hasSummary = researchData?.summary;
  
  // If no strategies but have summary, extract from summary
  let strategyPoints = strategies;
  if (strategyPoints.length === 0 && hasSummary) {
    strategyPoints = researchData.summary
      .split(/[•\*\-]/)
      .filter(point => point.trim().length > 20)
      .map(point => point.trim().replace(/^\d+\.?\s*/, ''))
      .slice(0, 5);
  }
  
  // If still no strategies, show next actions
  if (strategyPoints.length === 0 && nextActions.length > 0) {
    strategyPoints = nextActions.map(action => action.description || action.action || action).slice(0, 5);
  }
  
  if (strategyPoints.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Star className="h-4 w-4 text-purple-600 mr-2" />
          Engagement Strategy
        </h3>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Generating strategy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Star className="h-4 w-4 text-purple-600 mr-2" />
        Engagement Strategy
      </h3>
      
      <div className="space-y-3">
        {strategyPoints.map((point, idx) => (
          <div key={idx} className="flex items-start text-sm">
            <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <span className="text-purple-600 text-xs font-bold">{idx + 1}</span>
            </div>
            <span className="text-gray-700 leading-relaxed">{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sales Momentum Component - NEW Dynamic Component
const SalesMomentum = ({ researchData }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const momentum = dealIntelligence.momentum || 'steady';
  const dealScore = dealIntelligence.dealScore || 0;
  const riskFactors = dealIntelligence.riskFactors || [];
  const opportunities = dealIntelligence.opportunities || [];
  const stageData = dealIntelligence.stageData || {};
  
  const getMomentumColor = (momentum) => {
    switch (momentum?.toLowerCase()) {
      case 'accelerating': return 'text-green-600 bg-green-50 border-green-200';
      case 'steady': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'stalling': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'declining': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMomentumIcon = (momentum) => {
    switch (momentum?.toLowerCase()) {
      case 'accelerating': return <TrendingUp className="h-4 w-4" />;
      case 'steady': return <Activity className="h-4 w-4" />;
      case 'stalling': return <Clock className="h-4 w-4" />;
      case 'declining': return <TrendingDown className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Target className="h-4 w-4 text-blue-600 mr-2" />
        Sales Momentum
      </h3>
      
      {/* Momentum Status */}
      <div className={`border rounded-lg p-3 mb-3 ${getMomentumColor(momentum)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getMomentumIcon(momentum)}
            <span className="ml-2 font-semibold text-sm uppercase">{momentum}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{dealScore}%</div>
            <div className="text-xs">Deal Score</div>
          </div>
        </div>
        {stageData.timeInStage && (
          <div className="text-xs mt-2">In current stage: {stageData.timeInStage}</div>
        )}
      </div>

      {/* Key Factors */}
      <div className="space-y-2">
        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-green-800 uppercase">Opportunity</div>
                <div className="text-sm text-green-700">{opportunities[0].description || opportunities[0]}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-red-800 uppercase">Risk Factor</div>
                <div className="text-sm text-red-700">{riskFactors[0].description || riskFactors[0]}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Company Intel Component - Enhanced and Fully Dynamic
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
        {/* Company basics - only show if we have valid data */}
        {(companyInfo.industry && companyInfo.industry !== 'Unknown' && companyInfo.industry !== 'unknown') || 
         (companyInfo.size && companyInfo.size !== 'Unknown' && companyInfo.size !== 'unknown') || 
         companyInfo.revenue || companyInfo.location ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {companyInfo.industry && companyInfo.industry !== 'Unknown' && companyInfo.industry !== 'unknown' && (
              <div>
                <span className="text-gray-500">Industry:</span>
                <span className="ml-1 font-medium">{toTitleCase(companyInfo.industry)}</span>
              </div>
            )}
            {companyInfo.size && companyInfo.size !== 'Unknown' && companyInfo.size !== 'unknown' && (
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-1 font-medium">
                  {typeof companyInfo.size === 'number' ? `${companyInfo.size} employees` : companyInfo.size}
                </span>
              </div>
            )}
            {companyInfo.revenue && (
              <div>
                <span className="text-gray-500">Revenue:</span>
                <span className="ml-1 font-medium">{companyInfo.revenue}</span>
              </div>
            )}
            {companyInfo.location && (
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-1 font-medium">{companyInfo.location}</span>
              </div>
            )}
          </div>
        ) : null}
        
        {/* Company insights from deal intelligence */}
        {companyInsights.businessModel && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="flex items-start">
              <Briefcase className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-blue-800 uppercase">Business Model</div>
                <div className="text-sm text-blue-700">{companyInsights.businessModel}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Pain points */}
        {companyInsights.painPoints && companyInsights.painPoints.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-amber-800 uppercase">Pain Point</div>
                <div className="text-sm text-amber-700">{companyInsights.painPoints[0]}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Key signals from Apollo data */}
        {insights.buyingSignals?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <div className="flex items-start">
              <Zap className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-green-800 uppercase">Buying Signal</div>
                <div className="text-sm text-green-700">{insights.buyingSignals[0]}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Recent news */}
        {hasNews && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="flex items-start">
              <MessageSquare className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-blue-800 uppercase flex items-center">
                  Recent News
                  <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-1 rounded-full">
                    {googleData.length}
                  </span>
                </div>
                <div className="text-sm text-blue-700">{googleData[0].title.substring(0, 80)}...</div>
                {googleData[0].publishedDate && (
                  <div className="text-xs text-blue-500 mt-1">{formatDate(googleData[0].publishedDate)}</div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Growth indicators */}
        {insights.growthIndicators?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <div className="flex items-start">
              <TrendingUp className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-green-800 uppercase">Growth Signal</div>
                <div className="text-sm text-green-700">{insights.growthIndicators[0]}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Technologies */}
        {companyInsights.technologies && companyInsights.technologies.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded p-2">
            <div className="flex items-start">
              <Shield className="h-4 w-4 text-purple-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-purple-800 uppercase">Tech Stack</div>
                <div className="text-sm text-purple-700">
                  {companyInsights.technologies.slice(0, 3).join(', ')}
                  {companyInsights.technologies.length > 3 && ` +${companyInsights.technologies.length - 3} more`}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Show message if no company data */}
        {!companyInfo.industry && !companyInfo.size && !companyInfo.revenue && !companyInfo.location &&
         !insights.buyingSignals?.length && !hasNews && !insights.growthIndicators?.length && 
         !companyInsights.businessModel && !companyInsights.painPoints?.length && (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">Company intelligence being gathered...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Contact Strategy Component - Enhanced and Fully Dynamic
const ContactStrategy = ({ apolloData, pdlData, researchData }) => {
  const contacts = [];
  const dealIntelligence = researchData?.dealIntelligence || {};
  const keyContacts = dealIntelligence.keyContacts || [];
  
  // Add contacts from deal intelligence first (highest priority)
  keyContacts.forEach(contact => {
    contacts.push({
      name: contact.name,
      title: contact.role || contact.title || 'Unknown Title',
      priority: contact.priority || 'high',
      action: contact.recommendedAction || 'Initial outreach',
      email: contact.email,
      source: 'AI Analysis',
      influence: contact.influence || 'high'
    });
  });
  
  // Add PDL contact if available and not duplicate
  if (pdlData?.personData?.data) {
    const person = pdlData.personData.data;
    const personName = person.full_name || `${person.first_name || ''} ${person.last_name || ''}`;
    
    // Check for duplicates
    const isDuplicate = contacts.some(c => c.name.toLowerCase() === personName.toLowerCase());
    
    if (!isDuplicate) {
      contacts.push({
        name: personName,
        title: person.job_title || 'Unknown Title',
        priority: 'high',
        action: 'Initial outreach',
        email: person.emails?.[0]?.address,
        source: 'PDL',
        influence: 'high'
      });
    }
  }
  
  // Add Apollo contacts if not already included
  if (apolloData?.keyPeople?.length > 0) {
    apolloData.keyPeople.slice(0, 2).forEach(person => {
      const isDuplicate = contacts.some(c => c.name.toLowerCase() === person.name.toLowerCase());
      
      if (!isDuplicate) {
        contacts.push({
          name: person.name,
          title: person.title,
          priority: 'medium',
          action: 'Research & connect',
          email: person.email,
          source: 'Apollo',
          influence: 'medium'
        });
      }
    });
  }
  
  if (contacts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Users className="h-4 w-4 text-green-600 mr-2" />
          Contact Strategy
        </h3>
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">Identifying key contacts...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Users className="h-4 w-4 text-green-600 mr-2" />
        Contact Strategy
        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
          {contacts.length} Contact{contacts.length !== 1 ? 's' : ''}
        </span>
      </h3>
      
      <div className="space-y-2">
        {contacts.map((contact, idx) => {
          const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          
          return (
            <div key={idx} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className={`w-8 h-8 ${
                contact.priority === 'high' ? 'bg-red-500' : 
                contact.influence === 'high' ? 'bg-purple-500' : 'bg-blue-500'
              } text-white rounded-full flex items-center justify-center text-xs font-semibold`}>
                {initials}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-900">{toTitleCase(contact.name)}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    contact.priority === 'high' ? 'bg-red-100 text-red-700' : 
                    contact.influence === 'high' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {contact.priority.toUpperCase()}
                  </span>
                  {contact.source && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded">
                      {contact.source}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">{toTitleCase(contact.title)}</div>
                <div className="text-xs text-blue-600 font-medium">→ {contact.action}</div>
              </div>
              
              {contact.email && (
                <button className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded transition-colors" title="Send Email">
                  <Mail className="h-3 w-3 text-blue-600" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
// tabs/DashboardTab.jsx - Complete Part 3: Deal Playbook and Main Component

// Deal Playbook Component - Fully Dynamic
const DealPlaybook = ({ researchData, apolloData, pdlData }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const nextActions = dealIntelligence.nextActions || [];
  const completedMilestones = dealIntelligence.completedMilestones || [];
  const currentStage = dealIntelligence.currentStage || 'discovery';
  
  const generatePlaybookItems = () => {
    const items = [];
    
    // Add completed milestones first
    completedMilestones.forEach(milestone => {
      items.push({
        status: 'completed',
        text: milestone.description || milestone,
        priority: 'normal',
        date: milestone.completedDate ? formatDate(milestone.completedDate) : null
      });
    });
    
    // Add standard completed items if not already in milestones
    const standardCompleted = [
      'AI analysis completed',
      'Company profile researched', 
      'Key contacts identified',
      'Initial research completed'
    ];
    
    standardCompleted.forEach(item => {
      const alreadyExists = items.some(existing => 
        existing.text.toLowerCase().includes(item.toLowerCase().split(' ')[0])
      );
      
      if (!alreadyExists) {
        // Check if we actually have the data for this item
        if (item.includes('AI analysis') && researchData?.summary) {
          items.push({ status: 'completed', text: item, priority: 'normal' });
        } else if (item.includes('Company profile') && apolloData?.company) {
          items.push({ status: 'completed', text: item, priority: 'normal' });
        } else if (item.includes('Key contacts') && (apolloData?.keyPeople?.length > 0 || pdlData?.personData)) {
          items.push({ status: 'completed', text: item, priority: 'normal' });
        } else if (item.includes('Initial research') && researchData) {
          items.push({ status: 'completed', text: item, priority: 'normal' });
        }
      }
    });
    
    // Add next actions as pending items
    nextActions.forEach(action => {
      items.push({
        status: 'pending',
        text: action.description || action.action || action,
        priority: action.priority || 'medium',
        deadline: action.deadline ? formatDate(action.deadline) : null,
        isOverdue: action.isOverdue || false
      });
    });
    
    // Add stage-specific next steps if no custom next actions
    if (nextActions.length === 0) {
      const stageActions = {
        'discovery': [
          { text: 'Schedule discovery call', priority: 'high' },
          { text: 'Identify decision makers', priority: 'high' },
          { text: 'Understand business needs', priority: 'medium' }
        ],
        'qualified': [
          { text: 'Technical deep dive meeting', priority: 'high' },
          { text: 'Create business case', priority: 'medium' },
          { text: 'Map stakeholders', priority: 'medium' }
        ],
        'proposal': [
          { text: 'Deliver proposal presentation', priority: 'high' },
          { text: 'Address technical questions', priority: 'high' },
          { text: 'Schedule decision meeting', priority: 'medium' }
        ],
        'negotiation': [
          { text: 'Review contract terms', priority: 'high' },
          { text: 'Finalize implementation plan', priority: 'medium' },
          { text: 'Schedule signing meeting', priority: 'high' }
        ]
      };
      
      const currentStageActions = stageActions[currentStage] || stageActions['discovery'];
      currentStageActions.forEach(action => {
        items.push({
          status: 'pending',
          text: action.text,
          priority: action.priority
        });
      });
    }
    
    // Add future milestone items based on current stage
    const futureItems = [];
    if (currentStage === 'discovery' || currentStage === 'qualified') {
      futureItems.push(
        { text: 'Proposal development', priority: 'medium' },
        { text: 'Contract negotiation', priority: 'medium' },
        { text: 'Deal closed', priority: 'low' }
      );
    } else if (currentStage === 'proposal') {
      futureItems.push(
        { text: 'Contract negotiation', priority: 'medium' },
        { text: 'Deal closed', priority: 'low' }
      );
    } else if (currentStage === 'negotiation') {
      futureItems.push(
        { text: 'Deal closed', priority: 'medium' }
      );
    }
    
    futureItems.forEach(item => {
      items.push({
        status: 'future',
        text: item.text,
        priority: item.priority
      });
    });
    
    return items;
  };

  const items = generatePlaybookItems();

  const getStatusIcon = (status, isOverdue = false) => {
    if (isOverdue) return <AlertTriangle className="h-3 w-3 text-red-600" />;
    
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending': return <Clock className="h-3 w-3 text-amber-600" />;
      case 'future': return <AlertCircle className="h-3 w-3 text-gray-400" />;
      default: return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getItemStyle = (status, priority, isOverdue = false) => {
    if (isOverdue) return 'text-red-700 font-medium';
    if (status === 'completed') return 'text-gray-600 line-through';
    if (priority === 'high' && status === 'pending') return 'text-gray-900 font-medium';
    return 'text-gray-700';
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
            <span className={`flex-1 ${getItemStyle(item.status, item.priority, item.isOverdue)}`}>
              {item.text}
            </span>
            {item.deadline && (
              <span className="text-xs text-gray-500">{item.deadline}</span>
            )}
            {item.date && (
              <span className="text-xs text-green-600">{item.date}</span>
            )}
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

// Main Dashboard Component - Fully Dynamic
const DashboardTab = ({ 
  researchData, 
  googleData, 
  apolloData, 
  pdlData, 
  displayName, 
  lastUpdated, 
  handleTabClick 
}) => {
  // Extract all dynamic data from research
  const dealIntelligence = researchData?.dealIntelligence || {};
  const currentStage = dealIntelligence.currentStage || 'discovery';
  const dealScore = dealIntelligence.dealScore || 0;
  const nextActions = dealIntelligence.nextActions || [];
  const riskFactors = dealIntelligence.riskFactors || [];
  const stageData = dealIntelligence.stageData || {};
  
  // Calculate deal metrics dynamically
  const dealValue = apolloData?.deals?.[0]?.value ? 
    `$${apolloData.deals[0].value.toLocaleString()}` : 
    dealIntelligence.dealValue || 
    pdlData?.dealValue || 
    null;
    
  const dealRisk = dealScore >= 70 ? 'low' : 
                  dealScore >= 40 ? 'medium' : 'high';
  
  // Calculate metrics from actual data
  const highPriorityActions = nextActions.filter(action => 
    action.priority === 'high' || action.isOverdue
  ).length;
  
  const overdueActions = nextActions.filter(action => action.isOverdue).length;
  
  const thisWeekActions = nextActions.filter(action => {
    if (!action.deadline) return false;
    const deadline = new Date(action.deadline);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return deadline >= today && deadline <= weekFromNow;
  }).length;
  
  // Calculate estimated weeks to close based on stage and momentum
  const getWeeksToClose = () => {
    const stageWeeks = {
      'discovery': 16,
      'qualified': 12,
      'proposal': 8,
      'negotiation': 4
    };
    
    const baseWeeks = stageWeeks[currentStage] || 16;
    const momentum = dealIntelligence.momentum;
    
    if (momentum === 'accelerating') return Math.max(baseWeeks * 0.7, 2);
    if (momentum === 'stalling') return baseWeeks * 1.5;
    if (momentum === 'declining') return baseWeeks * 2;
    
    return baseWeeks;
  };
  
  const weeksToClose = Math.round(getWeeksToClose());
  
  const nextAction = nextActions.length > 0 ? 
    nextActions[0].description || nextActions[0].action || nextActions[0] :
    "Schedule discovery call to understand business needs";

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Dynamic Header with Metrics */}
      <HeaderWithMetrics 
        displayName={displayName}
        dealValue={dealValue}
        dealRisk={dealRisk}
        nextAction={nextAction}
        researchData={researchData}
      />
      
      {/* Dynamic Metrics Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <CompactMetricCard
          title="THIS WEEK"
          value={thisWeekActions || highPriorityActions}
          subtitle={thisWeekActions ? "Scheduled" : "High Priority"}
          icon={Calendar}
          color="blue"
          additionalInfo={stageData.timeInStage ? `In stage: ${stageData.timeInStage}` : null}
        />
        <CompactMetricCard
          title="OVERDUE" 
          value={overdueActions}
          subtitle="Actions"
          icon={AlertTriangle}
          color="red"
          urgency={overdueActions > 0 ? 'urgent' : 'normal'}
          additionalInfo={overdueActions > 0 ? "Needs attention" : "On track"}
        />
        <CompactMetricCard
          title="TIMELINE"
          value={`${weeksToClose}wks`}
          subtitle="Est. Close"
          icon={Timer}
          color={weeksToClose <= 4 ? 'green' : weeksToClose <= 8 ? 'amber' : 'blue'}
          additionalInfo={dealScore > 0 ? `${dealScore}% confidence` : null}
        />
      </div>
      
      {/* Main Content Grid - 3 Columns */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          <EngagementStrategy researchData={researchData} />
          <SalesMomentum researchData={researchData} />
          <DealPlaybook 
            researchData={researchData}
            apolloData={apolloData}
            pdlData={pdlData}
          />
        </div>
        
        {/* Middle Column */}
        <div className="space-y-4">
          <CompanyIntel 
            apolloData={apolloData}
            googleData={googleData}
            researchData={researchData}
          />
          <ContactStrategy 
            apolloData={apolloData}
            pdlData={pdlData}
            researchData={researchData}
          />
        </div>
        
        {/* Right Column - Quick Actions */}
        <div className="space-y-4">
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
                    <div className="text-xs text-blue-600">View success factors</div>
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
                    <div className="text-xs text-green-600">Deep company research</div>
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
                    <div className="text-xs text-purple-600">Decision maker details</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-purple-600" />
                </div>
              </button>
            </div>
          </div>
          
          {/* Recent Activity - Dynamic */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Activity className="h-4 w-4 text-gray-600 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-2 text-sm">
              {researchData?.summary && (
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Intelligence analysis completed</span>
                  <span className="ml-auto text-xs">Today</span>
                </div>
              )}
              {apolloData?.company && (
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Company research updated</span>
                  <span className="ml-auto text-xs">Today</span>
                </div>
              )}
              {googleData?.length > 0 && (
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <span>News monitoring active</span>
                  <span className="ml-auto text-xs">Today</span>
                </div>
              )}
              {lastUpdated && (
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                  <span>Data last refreshed</span>
                  <span className="ml-auto text-xs">{formatDate(lastUpdated)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;