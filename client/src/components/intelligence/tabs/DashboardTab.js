// tabs/DashboardTab.jsx - Dynamic Data Implementation
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
  CircleDollarSign,
  ExternalLink,
  Linkedin
} from 'lucide-react';

// Utility function to convert text to title case
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Utility function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return 'Invalid date';
  }
};

// Combined Header + Metrics Row (4-column layout) - Fully Dynamic
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
      {/* Client Info Card */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <User className="h-5 w-5 text-gray-600 mr-2" />
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Client Deal</span>
        </div>
        <div className="text-lg font-bold text-gray-900 mb-1">
          {toTitleCase(displayName)}
        </div>
        <div className="text-sm text-gray-600 font-medium mb-2">{dealValue}</div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getRiskColor(dealRisk)}`}>
          {dealRisk ? `${dealRisk.toUpperCase()} RISK` : 'ANALYZING'}
        </span>
      </div>

      {/* Deal Blockers - Dynamic */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-xs font-bold text-red-800 uppercase tracking-wide">Deal Blockers</span>
        </div>
        <div className="text-2xl font-bold text-red-700 mb-1">{criticalIssues}</div>
        <div className="text-sm text-red-600 font-medium">Critical Issues</div>
        <div className="text-xs text-red-500 mt-1">
          {isOverdue ? `Overdue ${timeInStage}` : 'Need Resolution'}
        </div>
      </div>

      {/* Decision Pending - Dynamic */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Clock className="h-5 w-5 text-amber-600 mr-2" />
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Decision Pending</span>
        </div>
        <div className="text-2xl font-bold text-amber-700 mb-1">{pendingDecision}</div>
        <div className="text-sm text-amber-600 font-medium">Stage</div>
        <div className="text-xs text-amber-500 mt-1">
          In stage: {timeInStage}
        </div>
      </div>

      {/* Hot Actions - Dynamic */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Zap className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Hot Actions</span>
        </div>
        <div className="text-2xl font-bold text-blue-700 mb-1">{highPriorityActions}</div>
        <div className="text-sm text-blue-600 font-medium">High Priority</div>
        <div className="text-xs text-blue-500 mt-1">
          {primaryAction ? `Due: ${formatDate(primaryAction.deadline)}` : 'No deadline set'}
        </div>
      </div>
    </div>
  );
};

// Enhanced Engagement Strategy Component with Title Deduplication
const EngagementStrategy = ({ researchData }) => {
  const hasSummary = researchData?.summary;
  
  if (!hasSummary) {
    return (
      <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3">
            <Star className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">AI-Powered Engagement Strategy</h2>
        </div>
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Generating personalized strategy...</p>
        </div>
      </div>
    );
  }

  // Parse strategy sections from summary
  const summaryText = researchData.summary;
  
  // Extract sections based on the emoji headers
  const sections = [
    {
      title: "1️⃣ TAILORED ENGAGEMENT STRATEGY",
      points: []
    },
    {
      title: "2️⃣ STRATEGIC OBJECTION HANDLING", 
      points: []
    },
    {
      title: "3️⃣ COMPETITIVE POSITIONING",
      points: []
    }
  ];
  
  // Split summary into sections and extract points
  const sectionRegex = /##\s*[1-3]️⃣\s*([^#]+?)(?=##\s*[1-3]️⃣|$)/gs;
  let match;
  let sectionIndex = 0;
  
  while ((match = sectionRegex.exec(summaryText)) !== null && sectionIndex < 3) {
    const sectionContent = match[1].trim();
    const points = sectionContent
      .split(/[•\*\-]/)
      .filter(point => point.trim().length > 15)
      .map(point => point.trim().replace(/^\d+\.?\s*/, ''))
      .filter(point => {
        // Filter out points that are just the section title repeated
        const cleanPoint = point.toLowerCase().replace(/[^\w\s]/g, '');
        return !cleanPoint.includes('tailored engagement strategy') && 
               !cleanPoint.includes('strategic objection handling') && 
               !cleanPoint.includes('competitive positioning');
      })
      .slice(0, 4); // Limit to 4 points per section
    
    sections[sectionIndex].points = points;
    sectionIndex++;
  }
  
  // Fallback: if no sections found, create generic points
  if (sections.every(section => section.points.length === 0)) {
    const allPoints = summaryText
      .split(/[•\*\-]/)
      .filter(point => point.trim().length > 20)
      .map(point => point.trim().replace(/^\d+\.?\s*/, ''))
      .slice(0, 6);
    
    sections[0].points = allPoints.slice(0, 2);
    sections[1].points = allPoints.slice(2, 4);
    sections[2].points = allPoints.slice(4, 6);
  }

  return (
    <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3">
          <Star className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">AI-Powered Engagement Strategy</h2>
      </div>
      
      <div className="space-y-6">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Clean Section Title */}
            <h3 className="text-base font-bold text-gray-800 mb-3">
              {section.title}
            </h3>
            
            {/* Section Points */}
            <div className="space-y-3 ml-4">
              {section.points.map((point, pointIdx) => (
                <div key={pointIdx} className="flex items-start bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-white text-xs font-bold">{pointIdx + 1}</span>
                  </div>
                  <div className="text-gray-700 leading-relaxed text-sm">{point}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sales Momentum Component - Fully Dynamic
const SalesMomentum = ({ researchData }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const dealScore = dealIntelligence.dealScore || null;
  const momentum = dealIntelligence.momentum || null;
  const engagementLevel = dealIntelligence.engagementLevel || null;
  const timeInStage = dealIntelligence.stageData?.timeInStage || null;
  const isOverdue = dealIntelligence.stageData?.isOverdue || false;
  const confidence = dealIntelligence.confidence || null;
  const reasoning = dealIntelligence.reasoning || null;
  
  const getMomentumData = (score, momentumStatus, overdue, engagement) => {
    // No hardcoded thresholds - use actual data and reasoning
    if (overdue) return { 
      status: 'Overdue', 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      border: 'border-red-300',
      icon: TrendingDown,
      advice: reasoning || 'Deal requires immediate attention'
    };
    
    if (momentumStatus === 'accelerating') return { 
      status: 'Accelerating', 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      border: 'border-green-300',
      icon: TrendingUp,
      advice: 'Momentum is building - maintain pace'
    };
    
    if (momentumStatus === 'building') return { 
      status: 'Building', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100', 
      border: 'border-blue-300',
      icon: Target,
      advice: 'Progress is steady - keep pushing'
    };
    
    if (momentumStatus === 'stalling' || momentumStatus === 'steady') return { 
      status: toTitleCase(momentumStatus || 'Unknown'), 
      color: 'text-amber-600', 
      bg: 'bg-amber-100', 
      border: 'border-amber-300',
      icon: Clock,
      advice: reasoning || 'Monitor closely for changes'
    };
    
    // Default based on score if no momentum data
    if (score >= 70) return { 
      status: 'Strong', 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      border: 'border-green-300',
      icon: TrendingUp,
      advice: 'High probability of success'
    };
    
    if (score >= 40) return { 
      status: 'Moderate', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100', 
      border: 'border-blue-300',
      icon: Target,
      advice: 'Mixed signals - needs attention'
    };
    
    if (score !== null) return { 
      status: 'Weak', 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      border: 'border-red-300',
      icon: TrendingDown,
      advice: reasoning || 'Significant challenges identified'
    };
    
    // No data available
    return { 
      status: 'Analyzing', 
      color: 'text-gray-600', 
      bg: 'bg-gray-100', 
      border: 'border-gray-300',
      icon: Activity,
      advice: 'Momentum analysis in progress'
    };
  };
  
  const momentumData = getMomentumData(dealScore, momentum, isOverdue, engagementLevel);
  const IconComponent = momentumData.icon;
  
  // Extract dynamic risk factors and opportunities - NO fallbacks
  const riskFactors = dealIntelligence.riskFactors || [];
  const opportunities = dealIntelligence.opportunities || [];
  const momentumSignals = dealIntelligence.momentumSignals || [];
  
  const momentumKillers = riskFactors
    .filter(risk => risk.description)
    .slice(0, 3)
    .map(risk => risk.description);
    
  const momentumBuilders = [
    ...opportunities.filter(opp => opp.opportunity).slice(0, 2).map(opp => opp.opportunity),
    ...momentumSignals.filter(signal => signal.type === 'positive' && signal.signal).slice(0, 2).map(signal => signal.signal)
  ].slice(0, 3);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <IconComponent className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Sales Momentum</h3>
      </div>
      
      <div className="text-center mb-4">
        <div className={`w-20 h-20 rounded-full ${momentumData.bg} ${momentumData.border} border-4 flex items-center justify-center mx-auto mb-2`}>
          <span className={`text-xl font-bold ${momentumData.color}`}>
            {dealScore !== null ? `${dealScore}%` : '?'}
          </span>
        </div>
        <p className={`text-sm font-medium ${momentumData.color}`}>{momentumData.status}</p>
        <p className="text-xs text-gray-500 mt-1">{momentumData.advice}</p>
        {engagementLevel && (
          <p className="text-xs text-gray-400 mt-1">Engagement: {engagementLevel}</p>
        )}
        {confidence && (
          <p className="text-xs text-gray-400">Confidence: {confidence}%</p>
        )}
      </div>
      
      <div className="space-y-3">
        {momentumKillers.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-red-800 uppercase mb-2">Momentum Killers</h4>
            <ul className="text-xs text-red-700 space-y-1">
              {momentumKillers.map((killer, idx) => (
                <li key={idx}>• {killer}</li>
              ))}
            </ul>
          </div>
        )}
        
        {momentumBuilders.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-green-800 uppercase mb-2">Momentum Builders</h4>
            <ul className="text-xs text-green-700 space-y-1">
              {momentumBuilders.map((builder, idx) => (
                <li key={idx}>• {builder}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Only show "analyzing" if no data at all */}
        {momentumKillers.length === 0 && momentumBuilders.length === 0 && riskFactors.length === 0 && opportunities.length === 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500">Momentum analysis in progress...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Critical Actions Component - Fully Dynamic
const CriticalActions = ({ researchData, displayName }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const nextActions = dealIntelligence.nextActions || [];
  const riskFactors = dealIntelligence.riskFactors || [];
  
  // Build actions from real data - NO hardcoding
  const dynamicActions = [];
  
  // Add next actions with their actual priorities and deadlines
  nextActions.forEach(action => {
    if (action.action && action.priority) {
      const priority = action.priority.toUpperCase();
      const color = priority === 'HIGH' ? 'red' : 
                   priority === 'MEDIUM' ? 'amber' : 'blue';
      
      dynamicActions.push({
        priority: priority,
        text: action.action,
        dueDate: action.deadline ? formatDate(action.deadline) : 'No deadline',
        color: color,
        expectedOutcome: action.expectedOutcome || null
      });
    }
  });
  
  // Add actions from risk factors with recommendations
  riskFactors.forEach(risk => {
    if (risk.recommendation && risk.severity) {
      const priority = risk.severity.toUpperCase();
      const color = priority === 'HIGH' ? 'red' : 
                   priority === 'MEDIUM' ? 'amber' : 'blue';
      
      dynamicActions.push({
        priority: priority,
        text: risk.recommendation,
        dueDate: 'Immediate',
        color: color,
        expectedOutcome: null
      });
    }
  });
  
  // Sort by priority (red first, then amber, then blue)
  dynamicActions.sort((a, b) => {
    const priorityOrder = { red: 0, amber: 1, blue: 2 };
    return priorityOrder[a.color] - priorityOrder[b.color];
  });
  
  const getPriorityStyle = (color) => {
    const styles = {
      red: 'bg-red-100 text-red-800 border-red-300',
      amber: 'bg-amber-100 text-amber-800 border-amber-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return styles[color] || styles.blue;
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Target className="h-5 w-5 text-red-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Critical Actions</h3>
      </div>
      
      <div className="space-y-3">
        {dynamicActions.length > 0 ? (
          dynamicActions.slice(0, 6).map((action, idx) => (
            <div key={idx} className={`border rounded-lg p-4 ${getPriorityStyle(action.color)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wide">
                  {action.priority}
                </span>
                <span className="text-xs opacity-75">{action.dueDate}</span>
              </div>
              <p className="text-sm font-medium">{action.text}</p>
              {action.expectedOutcome && (
                <p className="text-xs mt-2 opacity-75">Expected: {action.expectedOutcome}</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">No specific actions identified</p>
            <p className="text-xs text-gray-400 mt-1">AI analysis will generate recommendations</p>
          </div>
        )}
      </div>
    </div>
  );
};.severity === 'high' && risk.recommendation) {
      dynamicActions.push({
        priority: 'URGENT',
        text: risk.recommendation,
        dueDate: 'Immediate',
        color: 'red'
      });
    }
  });
  
  // Fallback to generic actions if no dynamic data
  if (dynamicActions.length === 0) {
    dynamicActions.push(
      {
        priority: 'HIGH',
        text: `Schedule follow-up call with ${displayName}`,
        dueDate: 'This week',
        color: 'amber'
      },
      {
        priority: 'MED',
        text: 'Prepare customized proposal',
        dueDate: 'Next week',
        color: 'blue'
      }
    );
  }
  
  const getPriorityStyle = (color) => {
    const styles = {
      red: 'bg-red-100 text-red-800 border-red-300',
      amber: 'bg-amber-100 text-amber-800 border-amber-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return styles[color] || styles.blue;
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Target className="h-5 w-5 text-red-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Critical Actions</h3>
      </div>
      
      <div className="space-y-3">
        {dynamicActions.slice(0, 4).map((action, idx) => (
          <div key={idx} className={`border rounded-lg p-4 ${getPriorityStyle(action.color)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wide">
                {action.priority}
              </span>
              <span className="text-xs opacity-75">{action.dueDate}</span>
            </div>
            <p className="text-sm font-medium">{action.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Contact Info Component - Fully Dynamic
const ContactInfo = ({ researchData, displayName }) => {
  const pdlData = researchData?.data?.pdl?.personData?.data;
  const companyData = researchData?.data?.pdl?.companyData;
  
  if (!pdlData && !companyData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Contact Information</h3>
        </div>
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">Contact research in progress...</p>
        </div>
      </div>
    );
  }
  
  // Extract ALL dynamic data - no defaults
  const fullName = pdlData?.full_name || displayName || null;
  const firstName = pdlData?.first_name || null;
  const lastName = pdlData?.last_name || null;
  const jobTitle = pdlData?.job_title || null;
  const company = pdlData?.job_company_name || companyData?.name || null;
  const industry = pdlData?.industry || pdlData?.job_company_industry || companyData?.industry || null;
  const linkedinUrl = pdlData?.linkedin_url || null;
  const linkedinUsername = pdlData?.linkedin_username || null;
  const hasWorkEmail = pdlData?.work_email === true;
  const hasPersonalEmail = pdlData?.personal_emails === true;
  const hasMobilePhone = pdlData?.mobile_phone === true;
  const hasPhoneNumbers = pdlData?.phone_numbers === true;
  const companySize = pdlData?.job_company_size || companyData?.size || companyData?.employee_count || null;
  const companyLocation = pdlData?.job_company_location_name || companyData?.location?.name || null;
  const jobStartDate = pdlData?.job_start_date || null;
  const jobLastVerified = pdlData?.job_last_verified || null;
  const skills = pdlData?.skills || [];
  const interests = pdlData?.interests || [];
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <User className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Contact Information</h3>
      </div>
      
      <div className="space-y-3">
        {/* Primary Contact - Only show if we have data */}
        {(fullName || firstName || jobTitle) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-blue-900">
                  {fullName ? toTitleCase(fullName) : 
                   (firstName && lastName ? `${toTitleCase(firstName)} ${toTitleCase(lastName)}` : 
                    firstName ? toTitleCase(firstName) : 'Name Unknown')}
                </div>
                {jobTitle && (
                  <div className="text-xs text-blue-700">{toTitleCase(jobTitle)}</div>
                )}
                {company && (
                  <div className="text-xs text-blue-600">{toTitleCase(company)}</div>
                )}
                {jobStartDate && (
                  <div className="text-xs text-blue-500">Since: {jobStartDate}</div>
                )}
              </div>
              {linkedinUrl && (
                <a 
                  href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  title={`LinkedIn: ${linkedinUsername || 'View Profile'}`}
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* Contact Methods - Only show available methods */}
        {(hasWorkEmail || hasPersonalEmail || hasMobilePhone || hasPhoneNumbers || linkedinUrl) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-green-800 uppercase mb-2">Contact Methods</div>
            <div className="space-y-1">
              {hasWorkEmail && (
                <div className="flex items-center text-xs text-green-700">
                  <Mail className="h-3 w-3 mr-2" />
                  Work Email Available
                </div>
              )}
              {hasPersonalEmail && !hasWorkEmail && (
                <div className="flex items-center text-xs text-green-700">
                  <Mail className="h-3 w-3 mr-2" />
                  Personal Email Available
                </div>
              )}
              {(hasMobilePhone || hasPhoneNumbers) && (
                <div className="flex items-center text-xs text-green-700">
                  <Phone className="h-3 w-3 mr-2" />
                  {hasMobilePhone ? 'Mobile Phone Available' : 'Phone Available'}
                </div>
              )}
              {linkedinUrl && (
                <div className="flex items-center text-xs text-green-700">
                  <Linkedin className="h-3 w-3 mr-2" />
                  LinkedIn Profile Active
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Company Info - Only show if we have data */}
        {(industry || companySize || companyLocation) && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-purple-800 uppercase mb-1">Company Details</div>
            <div className="text-sm text-purple-700">
              {industry && <span>{toTitleCase(industry)}</span>}
              {industry && (companySize || companyLocation) && <span> • </span>}
              {companySize && (
                <span>{typeof companySize === 'number' ? companySize.toLocaleString() : companySize} employees</span>
              )}
              {companySize && companyLocation && <span> • </span>}
              {companyLocation && <span>{companyLocation}</span>}
            </div>
          </div>
        )}
        
        {/* Skills/Interests - Only show if available */}
        {(skills.length > 0 || interests.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-amber-800 uppercase mb-1">
              {skills.length > 0 ? 'Key Skills' : 'Interests'}
            </div>
            <div className="text-xs text-amber-700">
              {skills.length > 0 ? 
                skills.slice(0, 5).map(skill => toTitleCase(skill)).join(', ') :
                interests.slice(0, 5).map(interest => toTitleCase(interest)).join(', ')
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Company Intel Component - Fully Dynamic
const CompanyIntel = ({ researchData }) => {
  const googleData = researchData?.data?.google || [];
  const companyData = researchData?.data?.pdl?.companyData;
  const dealIntelligence = researchData?.dealIntelligence || {};
  
  const opportunities = dealIntelligence.opportunities || [];
  const conversationStarters = dealIntelligence.conversationStarters || [];
  const keyInsights = dealIntelligence.keyInsights || [];
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Building className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Company Intelligence</h3>
      </div>
      
      <div className="space-y-3">
        {/* Recent News - Show multiple if available */}
        {googleData.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-800 uppercase mb-2">Recent News</div>
            {googleData.slice(0, 2).map((news, idx) => (
              <div key={idx} className="mb-2 last:mb-0">
                <div className="text-sm text-blue-700 mb-1">
                  {news.title ? news.title.substring(0, 80) + (news.title.length > 80 ? '...' : '') : 'News title unavailable'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">
                    {news.source || 'Unknown Source'} • {news.publishedDate ? formatDate(news.publishedDate) : 'No date'}
                  </span>
                  {news.url && (
                    <a 
                      href={news.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      Read <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Key Insights */}
        {keyInsights.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-green-800 uppercase mb-2">Key Insights</div>
            {keyInsights.slice(0, 2).map((insight, idx) => (
              <div key={idx} className="mb-2 last:mb-0">
                <div className="text-sm text-green-700">{insight.insight}</div>
                {insight.impact && (
                  <div className="text-xs text-green-600 mt-1">
                    Impact: {insight.impact} {insight.actionRequired && '• Action Required'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Opportunities</div>
            {opportunities.slice(0, 2).map((opp, idx) => (
              <div key={idx} className="mb-2 last:mb-0">
                <div className="text-sm text-amber-700">{opp.opportunity}</div>
                <div className="text-xs text-amber-600 mt-1 flex justify-between">
                  {opp.potential && <span>Potential: {opp.potential}</span>}
                  {opp.timeline && <span>{opp.timeline}</span>}
                </div>
                {opp.action && (
                  <div className="text-xs text-amber-600 mt-1 italic">Action: {opp.action}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Conversation Starters */}
        {conversationStarters.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-purple-800 uppercase mb-2">Conversation Starters</div>
            {conversationStarters.slice(0, 2).map((starter, idx) => (
              <div key={idx} className="mb-2 last:mb-0">
                <div className="text-sm text-purple-700 font-medium">
                  "{starter.question}"
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Topic: {starter.topic}
                </div>
                {starter.purpose && (
                  <div className="text-xs text-purple-500 mt-1 italic">
                    Purpose: {starter.purpose}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Company Profile */}
        {companyData && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-800 uppercase mb-2">Company Profile</div>
            <div className="space-y-1">
              {companyData.display_name && (
                <div className="text-sm font-medium text-gray-900">{companyData.display_name}</div>
              )}
              <div className="text-sm text-gray-700">
                {companyData.employee_count && (
                  <span>{companyData.employee_count.toLocaleString()} employees</span>
                )}
                {companyData.employee_count && companyData.industry && <span> • </span>}
                {companyData.industry && <span>{toTitleCase(companyData.industry)}</span>}
              </div>
              {companyData.location?.name && (
                <div className="text-xs text-gray-600">📍 {companyData.location.name}</div>
              )}
              {companyData.founded && (
                <div className="text-xs text-gray-600">Founded: {companyData.founded}</div>
              )}
              {companyData.website && (
                <div className="text-xs text-gray-600">
                  <a href={`https://${companyData.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {companyData.website}
                  </a>
                </div>
              )}
              {companyData.summary && (
                <div className="text-xs text-gray-600 mt-2">
                  {companyData.summary.substring(0, 150) + (companyData.summary.length > 150 ? '...' : '')}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Show analyzing message only if NO data at all */}
        {googleData.length === 0 && 
         opportunities.length === 0 && 
         conversationStarters.length === 0 && 
         keyInsights.length === 0 && 
         !companyData && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">Company intelligence analysis in progress...</p>
            <p className="text-xs text-gray-400 mt-1">Gathering news, insights, and opportunities</p>
          </div>
        )}
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
  // Extract ALL dynamic data from database - NO hardcoding
  const dealIntelligence = researchData?.dealIntelligence || {};
  const pdlPersonData = researchData?.data?.pdl?.personData?.data;
  const pdlCompanyData = researchData?.data?.pdl?.companyData;
  const apolloDeals = apolloData?.deals || [];
  const nextActions = dealIntelligence.nextActions || [];
  
  // Dynamic deal value calculation - multiple fallback sources
  let dealValue = null;
  
  // 1. Try Apollo data first
  if (apolloDeals.length > 0 && apolloDeals[0].value) {
    dealValue = `${apolloDeals[0].value.toLocaleString()}`;
  }
  // 2. Try PDL data
  else if (pdlData?.dealValue) {
    dealValue = pdlData.dealValue;
  }
  // 3. Try any deal value from research data
  else if (researchData?.dealValue) {
    dealValue = researchData.dealValue;
  }
  // 4. Try to extract from deal intelligence
  else if (dealIntelligence.dealValue) {
    dealValue = dealIntelligence.dealValue;
  }
  // 5. No deal value available
  else {
    dealValue = null;
  }
    
  // Dynamic risk calculation based on actual score and reasoning
  let dealRisk = null;
  const dealScore = dealIntelligence.dealScore;
  const reasoning = dealIntelligence.reasoning;
  const riskFactors = dealIntelligence.riskFactors || [];
  const isOverdue = dealIntelligence.stageData?.isOverdue;
  
  if (isOverdue) {
    dealRisk = 'High';
  } else if (dealScore !== null && dealScore !== undefined) {
    if (dealScore >= 70) dealRisk = 'Low';
    else if (dealScore >= 40) dealRisk = 'Medium';
    else dealRisk = 'High';
  } else if (riskFactors.length > 0) {
    const highRiskCount = riskFactors.filter(r => r.severity === 'high').length;
    if (highRiskCount >= 2) dealRisk = 'High';
    else if (highRiskCount >= 1 || riskFactors.length >= 3) dealRisk = 'Medium';
    else dealRisk = 'Low';
  } else {
    dealRisk = null; // Unable to determine
  }
    
  // Dynamic next action from multiple sources
  let nextAction = null;
  
  // 1. Try high priority next actions first
  const highPriorityActions = nextActions.filter(action => action.priority === 'high');
  if (highPriorityActions.length > 0) {
    nextAction = highPriorityActions[0].action;
  }
  // 2. Try any next action
  else if (nextActions.length > 0) {
    nextAction = nextActions[0].action;
  }
  // 3. Try to extract from risk factors
  else if (riskFactors.length > 0 && riskFactors[0].recommendation) {
    nextAction = riskFactors[0].recommendation;
  }
  // 4. Try from deal intelligence reasoning
  else if (reasoning) {
    // Extract actionable text from reasoning if it contains action words
    const actionWords = ['schedule', 'contact', 'follow up', 'meet', 'call', 'email', 'prepare'];
    const sentences = reasoning.split(/[.!?]+/);
    const actionSentence = sentences.find(sentence => 
      actionWords.some(word => sentence.toLowerCase().includes(word))
    );
    if (actionSentence) {
      nextAction = actionSentence.trim();
    }
  }
  // 5. No specific action available
  if (!nextAction) {
    nextAction = null;
  }

  // Dynamic display name with multiple fallbacks
  let dynamicDisplayName = displayName;
  
  // 1. Try PDL full name
  if (pdlPersonData?.full_name) {
    dynamicDisplayName = toTitleCase(pdlPersonData.full_name);
  }
  // 2. Try PDL first/last name combination
  else if (pdlPersonData?.first_name) {
    const lastName = pdlPersonData.last_name || '';
    dynamicDisplayName = toTitleCase(`${pdlPersonData.first_name} ${lastName}`.trim());
  }
  // 3. Try company name if no person name
  else if (!displayName && (pdlCompanyData?.display_name || pdlCompanyData?.name)) {
    dynamicDisplayName = toTitleCase(pdlCompanyData.display_name || pdlCompanyData.name);
  }
  // 4. Keep original displayName as fallback
  
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Combined Header + Metrics Row - Fully Dynamic */}
      <HeaderWithMetrics 
        displayName={dynamicDisplayName}
        dealValue={dealValue}
        dealRisk={dealRisk}
        nextAction={nextAction}
        researchData={researchData}
      />
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Hero Engagement Strategy (spans 2 columns) */}
        <div className="lg:col-span-2">
          <EngagementStrategy researchData={researchData} />
        </div>
        
        {/* Right Sidebar - All Dynamic Components */}
        <div className="space-y-6">
          <SalesMomentum researchData={researchData} />
          <CriticalActions researchData={researchData} displayName={dynamicDisplayName} />
          <ContactInfo researchData={researchData} displayName={dynamicDisplayName} />
          <CompanyIntel researchData={researchData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;Data, 
  displayName, 
  lastUpdated, 
  handleTabClick 
}) => {
  // Calculate dynamic deal metrics
  const dealIntelligence = researchData?.dealIntelligence || {};
  const pdlPersonData = researchData?.data?.pdl?.personData?.data;
  
  // Dynamic deal value calculation
  const dealValue = apolloData?.deals?.[0]?.value ? 
    `$${apolloData.deals[0].value.toLocaleString()}` : 
    pdlData?.dealValue || 
    '$285K'; // Fallback
    
  // Dynamic risk calculation
  const dealScore = dealIntelligence.dealScore || 30;
  const dealRisk = dealScore >= 70 ? 'Low' : 
                   dealScore >= 40 ? 'Medium' : 'High';
    
  // Dynamic next action
  const nextActions = dealIntelligence.nextActions || [];
  const nextAction = nextActions.length > 0 ? 
    nextActions[0].action : 
    "Schedule discovery call";

  // Dynamic display name (prefer PDL data)
  const dynamicDisplayName = pdlPersonData?.full_name ? 
    toTitleCase(pdlPersonData.full_name) : 
    displayName;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Combined Header + Metrics Row with Dynamic Data */}
      <HeaderWithMetrics 
        displayName={dynamicDisplayName}
        dealValue={dealValue}
        dealRisk={dealRisk}
        nextAction={nextAction}
        researchData={researchData}
      />
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Hero Engagement Strategy (spans 2 columns) */}
        <div className="lg:col-span-2">
          <EngagementStrategy researchData={researchData} />
        </div>
        
        {/* Right Sidebar with Dynamic Components */}
        <div className="space-y-6">
          <SalesMomentum researchData={researchData} />
          <CriticalActions researchData={researchData} displayName={dynamicDisplayName} />
          <ContactInfo researchData={researchData} displayName={dynamicDisplayName} />
          <CompanyIntel researchData={researchData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;