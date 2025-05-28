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

// Deal Header Component
const DealHeader = ({ displayName, dealValue, dealRisk, nextAction }) => {
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {toTitleCase(displayName)}{dealValue && ` - ${dealValue}`}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            <span className={`font-medium ${getRiskColor(dealRisk)}`}>
              {dealRisk ? `${dealRisk.toUpperCase()} RISK` : 'ANALYZING'}
            </span>
            {nextAction && <span className="ml-4">• Next: {nextAction}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

// Deal Blocker Metrics - Option A
const DealBlockerMetrics = () => {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {/* Deal Blockers */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <span className="text-sm font-bold text-red-800 uppercase tracking-wide">Deal Blockers</span>
        </div>
        <div className="text-3xl font-bold text-red-700 mb-1">2</div>
        <div className="text-sm text-red-600 font-medium">Critical Issues</div>
        <div className="text-xs text-red-500 mt-1">Need Resolution</div>
      </div>

      {/* Decision Pending */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
        <div className="flex items-center mb-3">
          <Clock className="h-6 w-6 text-amber-600 mr-3" />
          <span className="text-sm font-bold text-amber-800 uppercase tracking-wide">Decision Pending</span>
        </div>
        <div className="text-3xl font-bold text-amber-700 mb-1">Budget</div>
        <div className="text-sm text-amber-600 font-medium">Approval</div>
        <div className="text-xs text-amber-500 mt-1">Timeline: 3 days</div>
      </div>

      {/* Hot Actions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-3">
          <Zap className="h-6 w-6 text-blue-600 mr-3" />
          <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">Hot Actions</span>
        </div>
        <div className="text-3xl font-bold text-blue-700 mb-1">Call</div>
        <div className="text-sm text-blue-600 font-medium">Rob Today</div>
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
      <div className="bg-white border-2 border-purple-200 rounded-xl p-8">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4">
            <Star className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Engagement Strategy</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Generating personalized strategy...</p>
        </div>
      </div>
    );
  }

  // Extract strategy points from summary
  const summaryText = researchData.summary;
  const strategyPoints = summaryText
    .split(/[•\*\-]/)
    .filter(point => point.trim().length > 20)
    .map(point => point.trim().replace(/^\d+\.?\s*/, ''))
    .slice(0, 6); // Limit to 6 key points

  return (
    <div className="bg-white border-2 border-purple-200 rounded-xl p-8">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4">
          <Star className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">AI-Powered Engagement Strategy</h2>
      </div>
      
      <div className="space-y-5">
        {strategyPoints.map((point, idx) => (
          <div key={idx} className="flex items-start bg-purple-50 rounded-lg p-5 border-l-4 border-purple-500">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <span className="text-white text-sm font-bold">{idx + 1}</span>
            </div>
            <div className="text-gray-700 leading-relaxed font-medium">{point}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Deal Health Score Component
const DealHealthScore = ({ winProbability = 30 }) => {
  const getHealthColor = (score) => {
    if (score >= 70) return { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-300' };
    if (score >= 40) return { color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-300' };
    return { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300' };
  };
  
  const healthStyle = getHealthColor(winProbability);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Activity className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Deal Health</h3>
      </div>
      
      <div className="text-center mb-4">
        <div className={`w-20 h-20 rounded-full ${healthStyle.bg} ${healthStyle.border} border-4 flex items-center justify-center mx-auto mb-2`}>
          <span className={`text-2xl font-bold ${healthStyle.color}`}>{winProbability}%</span>
        </div>
        <p className="text-sm text-gray-600">Win Probability</p>
      </div>
      
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-red-800 uppercase mb-2">Risk Factors</h4>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• No specific questions indicate low engagement</li>
            <li>• Integration concerns need addressing</li>
            <li>• Budget timeline unclear</li>
          </ul>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-green-800 uppercase mb-2">Strengths</h4>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Actively requesting demos</li>
            <li>• Expansion indicates growth investment</li>
            <li>• Clear compliance initiatives</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Critical Actions Component
const CriticalActions = () => {
  const actions = [
    {
      priority: 'URGENT',
      text: 'Follow up on overdue Chase items',
      dueDate: '2 days overdue',
      color: 'red'
    },
    {
      priority: 'HIGH',
      text: 'Schedule discovery call with Rob Lupoli',
      dueDate: 'Today',
      color: 'amber'
    },
    {
      priority: 'HIGH',
      text: 'Prepare UAD/UCDP integration demo',
      dueDate: 'This week',
      color: 'amber'
    },
    {
      priority: 'MED',
      text: 'Research Minnesota expansion details',
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
const KeyCompanyIntel = ({ apolloData, googleData }) => {
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
          <div className="text-sm text-amber-700">Rob Lupoli - Primary Contact</div>
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
  const nextAction = "Schedule discovery call with Rob Lupoli";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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
          <DealHealthScore winProbability={winProbability} />
          <CriticalActions />
          <KeyCompanyIntel 
            apolloData={apolloData}
            googleData={googleData}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;