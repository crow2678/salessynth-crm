// tabs/DashboardTab.jsx
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

// Utility function to convert text to title case
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Minimal Deal Header Component - Option D (True Single Line)
const DealHeader = ({ displayName, dealValue, dealRisk, nextAction }) => {
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex items-center justify-between py-2 px-4 bg-white border border-gray-200 rounded-lg mb-4">
      {/* Left side: Name, Amount, Risk Badge - ALL IN ONE LINE */}
      <div className="flex items-center space-x-3">
        <h1 className="text-lg font-bold text-gray-900">
          {toTitleCase(displayName)} - {dealValue || '$285K'}
        </h1>
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getRiskColor(dealRisk)}`}>
          {dealRisk ? `${dealRisk.toUpperCase()} RISK` : 'ANALYZING'}
        </span>
      </div>
      
      {/* Right side: Next Action */}
      <div className="text-sm text-gray-600 flex items-center">
        <span className="font-medium text-gray-700">Next:</span> 
        <span className="ml-1">{nextAction || 'Schedule discovery call'}</span>
      </div>
    </div>
  );
};

// Deal Blocker Metrics - Option A (Compact)
const DealBlockerMetrics = ({ dealBlockers = 2, pendingDecision = "Budget", decisionTimeline = "3 days", hotAction = "Call", actionTarget = "Contact", actionDeadline = "Today" }) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Deal Blockers */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-xs font-bold text-red-800 uppercase tracking-wide">Deal Blockers</span>
        </div>
        <div className="text-2xl font-bold text-red-700 mb-1">{dealBlockers}</div>
        <div className="text-sm text-red-600 font-medium">Critical Issues</div>
        <div className="text-xs text-red-500 mt-1">Need Resolution</div>
      </div>

      {/* Decision Pending */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Clock className="h-5 w-5 text-amber-600 mr-2" />
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Decision Pending</span>
        </div>
        <div className="text-2xl font-bold text-amber-700 mb-1">{pendingDecision}</div>
        <div className="text-sm text-amber-600 font-medium">Approval</div>
        <div className="text-xs text-amber-500 mt-1">Timeline: {decisionTimeline}</div>
      </div>

      {/* Hot Actions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Zap className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Hot Actions</span>
        </div>
        <div className="text-2xl font-bold text-blue-700 mb-1">{hotAction}</div>
        <div className="text-sm text-blue-600 font-medium">{actionTarget} {actionDeadline}</div>
        <div className="text-xs text-blue-500 mt-1">Demo Tomorrow</div>
      </div>
    </div>
  );
};

// Enhanced Engagement Strategy Component
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
            {/* Section Title */}
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
              <span className="text-purple-600 mr-2">##</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">ℹ️</span>
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

// Sales Momentum Component (replaces Deal Health)
const SalesMomentum = ({ winProbability = 30 }) => {
  const getMomentumData = (score) => {
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
      advice: 'Urgent intervention'
    };
  };
  
  const momentum = getMomentumData(winProbability);
  const IconComponent = momentum.icon;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <IconComponent className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Sales Momentum</h3>
      </div>
      
      <div className="text-center mb-4">
        <div className={`w-20 h-20 rounded-full ${momentum.bg} ${momentum.border} border-4 flex items-center justify-center mx-auto mb-2`}>
          <span className={`text-xl font-bold ${momentum.color}`}>{winProbability}%</span>
        </div>
        <p className={`text-sm font-medium ${momentum.color}`}>{momentum.status}</p>
        <p className="text-xs text-gray-500 mt-1">{momentum.advice}</p>
      </div>
      
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-amber-800 uppercase mb-2">Momentum Killers</h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• Delayed responses (5+ days)</li>
            <li>• Lack of technical questions</li>
            <li>• Budget concerns unresolved</li>
          </ul>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-green-800 uppercase mb-2">Momentum Builders</h4>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Demo request signals interest</li>
            <li>• Multiple stakeholder involvement</li>
            <li>• Compliance urgency creates timeline</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Critical Actions Component
const CriticalActions = ({ clientName = "Client" }) => {
  const actions = [
    {
      priority: 'URGENT',
      text: `Follow up on overdue ${clientName} items`,
      dueDate: '2 days overdue',
      color: 'red'
    },
    {
      priority: 'HIGH',
      text: `Schedule discovery call with ${clientName}`,
      dueDate: 'Today',
      color: 'amber'
    },
    {
      priority: 'HIGH',
      text: 'Prepare integration demo materials',
      dueDate: 'This week',
      color: 'amber'
    },
    {
      priority: 'MED',
      text: 'Research company expansion details',
      dueDate: 'Next week',
      color: 'blue'
    }
  ];
  
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
        {actions.map((action, idx) => (
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

// Key Company Intel Component
const KeyCompanyIntel = ({ apolloData, googleData, clientName = "Unknown Company" }) => {
  const companyInfo = apolloData?.company || {};
  const insights = apolloData?.insights || {};
  const hasNews = googleData && googleData.length > 0;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Building className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Key Intel</h3>
      </div>
      
      <div className="space-y-3">
        {hasNews && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-800 uppercase mb-1">Recent News</div>
            <div className="text-sm text-blue-700">{googleData[0].title.substring(0, 80)}...</div>
          </div>
        )}
        
        {insights.buyingSignals?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-green-800 uppercase mb-1">Buying Signal</div>
            <div className="text-sm text-green-700">{insights.buyingSignals[0]}</div>
          </div>
        )}
        
        {(companyInfo.industry && companyInfo.industry !== 'Unknown') && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-purple-800 uppercase mb-1">Industry Focus</div>
            <div className="text-sm text-purple-700">{toTitleCase(companyInfo.industry)}</div>
          </div>
        )}
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-amber-800 uppercase mb-1">Decision Maker</div>
          <div className="text-sm text-amber-700">{clientName} - Primary Contact</div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const DashboardTab = ({ 
  researchData, 
  googleData, 
  apolloData, 
  pdlData, 
  displayName, 
  lastUpdated, 
  handleTabClick 
}) => {
  // Calculate deal metrics
  const dealValue = apolloData?.deals?.[0]?.value ? 
    `$${apolloData.deals[0].value.toLocaleString()}` : 
    pdlData?.dealValue || '$285K';
    
  const dealRisk = pdlData?.dealScore ? 
    (pdlData.dealScore >= 70 ? 'Low' : 
     pdlData.dealScore >= 40 ? 'Medium' : 'High') : 
    'High';
    
  const winProbability = pdlData?.dealScore || 30;
  const nextAction = "Schedule discovery call";

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Deal Header */}
      <DealHeader 
        displayName={displayName}
        dealValue={dealValue}
        dealRisk={dealRisk}
        nextAction={nextAction}
      />
      
      {/* Deal Blocker Metrics - Option A */}
      <DealBlockerMetrics />
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Hero Engagement Strategy (spans 2 columns) */}
        <div className="lg:col-span-2">
          <EngagementStrategy researchData={researchData} />
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-6">
          <SalesMomentum winProbability={winProbability} />
          <CriticalActions clientName={displayName} />
          <KeyCompanyIntel 
            apolloData={apolloData}
            googleData={googleData}
            clientName={displayName}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;