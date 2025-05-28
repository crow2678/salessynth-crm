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

// Combined Header + Metrics Row (4-column layout) - Now with Dynamic Data
const HeaderWithMetrics = ({ displayName, dealValue, dealRisk, nextAction, researchData }) => {
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
  const timeInStage = dealIntelligence.stageData?.timeInStage || 'Unknown';
  const currentStage = dealIntelligence.currentStage || 'Discovery';
  const isOverdue = dealIntelligence.stageData?.isOverdue || false;

  // Calculate metrics from real data
  const criticalIssues = riskFactors.filter(risk => risk.severity === 'high').length;
  const pendingDecision = currentStage.replace('_', ' ').toUpperCase();
  const highPriorityActions = nextActions.filter(action => action.priority === 'high').length;
  const primaryAction = nextActions.length > 0 ? nextActions[0] : null;

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

// Sales Momentum Component with Dynamic Data
const SalesMomentum = ({ researchData }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const dealScore = dealIntelligence.dealScore || 30;
  const momentum = dealIntelligence.momentum || 'steady';
  const engagementLevel = dealIntelligence.engagementLevel || 'medium';
  const timeInStage = dealIntelligence.stageData?.timeInStage || 'Unknown';
  const isOverdue = dealIntelligence.stageData?.isOverdue || false;
  
  const getMomentumData = (score, momentumStatus, overdue) => {
    if (overdue) return { 
      status: 'Stalling', 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      border: 'border-red-300',
      icon: TrendingDown,
      advice: 'Urgent intervention needed'
    };
    
    if (score >= 70) return { 
      status: 'Accelerating', 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      border: 'border-green-300',
      icon: TrendingUp,
      advice: 'Push for close'
    };
    
    if (score >= 40) return { 
      status: 'Building', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100', 
      border: 'border-blue-300',
      icon: Target,
      advice: 'Maintain pressure'
    };
    
    return { 
      status: 'Stalling', 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      border: 'border-red-300',
      icon: TrendingDown,
      advice: 'Urgent intervention needed'
    };
  };
  
  const momentumData = getMomentumData(dealScore, momentum, isOverdue);
  const IconComponent = momentumData.icon;
  
  // Extract real risk factors and opportunities
  const riskFactors = dealIntelligence.riskFactors || [];
  const opportunities = dealIntelligence.opportunities || [];
  const momentumSignals = dealIntelligence.momentumSignals || [];
  
  const momentumKillers = riskFactors.slice(0, 3).map(risk => risk.description);
  const momentumBuilders = [
    ...opportunities.slice(0, 2).map(opp => opp.opportunity),
    ...momentumSignals.filter(signal => signal.type === 'positive').slice(0, 2).map(signal => signal.signal)
  ].slice(0, 3);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <IconComponent className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Sales Momentum</h3>
      </div>
      
      <div className="text-center mb-4">
        <div className={`w-20 h-20 rounded-full ${momentumData.bg} ${momentumData.border} border-4 flex items-center justify-center mx-auto mb-2`}>
          <span className={`text-xl font-bold ${momentumData.color}`}>{dealScore}%</span>
        </div>
        <p className={`text-sm font-medium ${momentumData.color}`}>{momentumData.status}</p>
        <p className="text-xs text-gray-500 mt-1">{momentumData.advice}</p>
        <p className="text-xs text-gray-400 mt-1">Engagement: {engagementLevel}</p>
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
        
        {/* Fallback if no dynamic data */}
        {momentumKillers.length === 0 && momentumBuilders.length === 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500">Analyzing momentum factors...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Critical Actions Component with Dynamic Data
const CriticalActions = ({ researchData, displayName }) => {
  const dealIntelligence = researchData?.dealIntelligence || {};
  const nextActions = dealIntelligence.nextActions || [];
  const riskFactors = dealIntelligence.riskFactors || [];
  
  // Build actions from real data
  const dynamicActions = [];
  
  // Add high priority next actions
  nextActions.forEach(action => {
    if (action.priority === 'high') {
      dynamicActions.push({
        priority: 'URGENT',
        text: action.action,
        dueDate: formatDate(action.deadline),
        color: 'red'
      });
    } else if (action.priority === 'medium') {
      dynamicActions.push({
        priority: 'HIGH',
        text: action.action,
        dueDate: formatDate(action.deadline),
        color: 'amber'
      });
    }
  });
  
  // Add actions from risk factors with recommendations
  riskFactors.forEach(risk => {
    if (risk.severity === 'high' && risk.recommendation) {
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

// Enhanced Contact Info Component with Dynamic Data
const ContactInfo = ({ researchData, displayName }) => {
  const pdlData = researchData?.data?.pdl?.personData?.data;
  const companyData = researchData?.data?.pdl?.companyData;
  
  if (!pdlData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Contact Information</h3>
        </div>
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">Contact details being researched...</p>
        </div>
      </div>
    );
  }
  
  const fullName = pdlData.full_name || displayName;
  const jobTitle = pdlData.job_title || 'Unknown Title';
  const company = pdlData.job_company_name || 'Unknown Company';
  const industry = pdlData.industry || pdlData.job_company_industry || 'Unknown';
  const linkedinUrl = pdlData.linkedin_url;
  const hasWorkEmail = pdlData.work_email === true;
  const hasMobilePhone = pdlData.mobile_phone === true;
  const companySize = pdlData.job_company_size || companyData?.size || 'Unknown';
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <User className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Contact Information</h3>
      </div>
      
      <div className="space-y-3">
        {/* Primary Contact */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-blue-900">{toTitleCase(fullName)}</div>
              <div className="text-xs text-blue-700">{toTitleCase(jobTitle)}</div>
              <div className="text-xs text-blue-600">{toTitleCase(company)}</div>
            </div>
            {linkedinUrl && (
              <a 
                href={`https://${linkedinUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        
        {/* Contact Methods */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-green-800 uppercase mb-2">Available Contact</div>
          <div className="space-y-1">
            {hasWorkEmail && (
              <div className="flex items-center text-xs text-green-700">
                <Mail className="h-3 w-3 mr-2" />
                Work Email Available
              </div>
            )}
            {hasMobilePhone && (
              <div className="flex items-center text-xs text-green-700">
                <Phone className="h-3 w-3 mr-2" />
                Mobile Phone Available
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
        
        {/* Company Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-purple-800 uppercase mb-1">Company Details</div>
          <div className="text-sm text-purple-700">
            {toTitleCase(industry)} • {companySize} employees
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Company Intel Component with Dynamic Data
const CompanyIntel = ({ researchData }) => {
  const googleData = researchData?.data?.google || [];
  const companyData = researchData?.data?.pdl?.companyData;
  const dealIntelligence = researchData?.dealIntelligence || {};
  
  const hasNews = googleData.length > 0;
  const opportunities = dealIntelligence.opportunities || [];
  const conversationStarters = dealIntelligence.conversationStarters || [];
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Building className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Company Intelligence</h3>
      </div>
      
      <div className="space-y-3">
        {/* Recent News */}
        {hasNews && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-800 uppercase mb-1">Recent News</div>
            <div className="text-sm text-blue-700 mb-2">
              {googleData[0].title.substring(0, 80)}...
            </div>
            <a 
              href={googleData[0].url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              Read More <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        )}
        
        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-green-800 uppercase mb-1">Key Opportunity</div>
            <div className="text-sm text-green-700">{opportunities[0].opportunity}</div>
            {opportunities[0].timeline && (
              <div className="text-xs text-green-600 mt-1">Timeline: {opportunities[0].timeline}</div>
            )}
          </div>
        )}
        
        {/* Conversation Starters */}
        {conversationStarters.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-amber-800 uppercase mb-1">Conversation Starter</div>
            <div className="text-sm text-amber-700">
              "{conversationStarters[0].question}"
            </div>
            <div className="text-xs text-amber-600 mt-1">
              Topic: {conversationStarters[0].topic}
            </div>
          </div>
        )}
        
        {/* Company Details */}
        {companyData && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-purple-800 uppercase mb-1">Company Profile</div>
            <div className="text-sm text-purple-700">
              {companyData.employee_count?.toLocaleString()} employees • {toTitleCase(companyData.industry)}
            </div>
            {companyData.summary && (
              <div className="text-xs text-purple-600 mt-1">
                {companyData.summary.substring(0, 100)}...
              </div>
            )}
          </div>
        )}
        
        {/* Show message if no dynamic data */}
        {!hasNews && opportunities.length === 0 && conversationStarters.length === 0 && !companyData && (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">Company intelligence being gathered...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component with Dynamic Data
const DashboardTab = ({ 
  researchData, 
  googleData, 
  apolloData, 
  pdlData, 
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