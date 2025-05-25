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
  MapPin
} from 'lucide-react';
import { GoogleNewsCard } from '../common/CommonComponents';
import { formatMarkdown } from '../utils/intelligenceUtils';

// Utility function to convert text to title case
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Compact Deal Header
const CompactDealHeader = ({ displayName, dealValue, dealRisk, nextAction }) => {
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {toTitleCase(displayName)}{dealValue && ` - ${dealValue}`}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            <span className={`font-medium ${getRiskColor(dealRisk)}`}>
              {dealRisk ? `${dealRisk.toUpperCase()} RISK` : 'ANALYZING'}
            </span>
            {nextAction && <span className="ml-3">• Next: {nextAction}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

// Compact Metric Card
const CompactMetricCard = ({ title, value, subtitle, icon: IconComponent, color = 'blue', urgency = 'normal' }) => {
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
        </div>
        <IconComponent className={`h-5 w-5 ${getTextColor(color, urgency).replace('text-', 'text-').replace('-700', '-600')}`} />
      </div>
    </div>
  );
};

// Engagement Strategy Component
const EngagementStrategy = ({ researchData }) => {
  const hasSummary = researchData?.summary;
  
  if (!hasSummary) {
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

  // Extract ALL strategy points from summary - don't limit them
  const summaryText = researchData.summary;
  const strategyPoints = summaryText
    .split(/[•\*\-]/)
    .filter(point => point.trim().length > 20)
    .map(point => point.trim().replace(/^\d+\.?\s*/, ''));

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

// Company Intel Component
const CompanyIntel = ({ apolloData, googleData }) => {
  const companyInfo = apolloData?.company || {};
  const insights = apolloData?.insights || {};
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
         (companyInfo.size && companyInfo.size !== 'Unknown' && companyInfo.size !== 'unknown') ? (
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
                  {companyInfo.size ? `${companyInfo.size} employees` : 'Unknown'}
                </span>
              </div>
            )}
          </div>
        ) : null}
        
        {/* Key signals */}
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
                <div className="text-xs font-semibold text-blue-800 uppercase">Recent News</div>
                <div className="text-sm text-blue-700">{googleData[0].title.substring(0, 80)}...</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Growth indicators */}
        {insights.growthIndicators?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <div className="flex items-start">
              <TrendingUp className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-amber-800 uppercase">Growth Signal</div>
                <div className="text-sm text-amber-700">{insights.growthIndicators[0]}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Show message if no company data */}
        {!companyInfo.industry && !companyInfo.size && !insights.buyingSignals?.length && !hasNews && !insights.growthIndicators?.length && (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">Company intelligence being gathered...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Contact Strategy Component
const ContactStrategy = ({ apolloData, pdlData }) => {
  const contacts = [];
  
  // Add PDL contact if available
  if (pdlData?.personData?.data) {
    const person = pdlData.personData.data;
    contacts.push({
      name: person.full_name || `${person.first_name || ''} ${person.last_name || ''}`,
      title: person.job_title || 'Unknown Title',
      priority: 'high',
      action: 'Initial outreach',
      email: person.emails?.[0]?.address
    });
  }
  
  // Add Apollo contacts
  if (apolloData?.keyPeople?.length > 0) {
    apolloData.keyPeople.slice(0, 2).forEach(person => {
      contacts.push({
        name: person.name,
        title: person.title,
        priority: 'medium',
        action: 'Research & connect',
        email: person.email
      });
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
          <p className="text-sm text-gray-500">No contacts identified yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Users className="h-4 w-4 text-green-600 mr-2" />
        Contact Strategy
      </h3>
      
      <div className="space-y-2">
        {contacts.map((contact, idx) => {
          const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          
          return (
            <div key={idx} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className={`w-8 h-8 ${
                contact.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'
              } text-white rounded-full flex items-center justify-center text-xs font-semibold`}>
                {initials}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-900">{toTitleCase(contact.name)}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    contact.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {contact.priority.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-600">{toTitleCase(contact.title)}</div>
                <div className="text-xs text-blue-600 font-medium">→ {contact.action}</div>
              </div>
              
              {contact.email && (
                <button className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded transition-colors">
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

// Deal Playbook Component
const DealPlaybook = ({ researchData, apolloData, pdlData }) => {
  const generatePlaybookItems = () => {
    const items = [];
    
    // Research completed
    if (researchData?.summary) {
      items.push({
        status: 'completed',
        text: 'AI analysis completed',
        priority: 'normal'
      });
    }
    
    // Company research
    if (apolloData?.company) {
      items.push({
        status: 'completed', 
        text: 'Company profile researched',
        priority: 'normal'
      });
    }
    
    // Contact identification
    if (apolloData?.keyPeople?.length > 0 || pdlData?.personData) {
      items.push({
        status: 'completed',
        text: 'Key contacts identified',
        priority: 'normal'
      });
    }
    
    // Next steps
    items.push(
      {
        status: 'pending',
        text: 'Initial contact outreach',
        priority: 'high'
      },
      {
        status: 'pending',
        text: 'Discovery call scheduled',
        priority: 'high'
      },
      {
        status: 'future',
        text: 'Needs assessment',
        priority: 'medium'
      }
    );
    
    return items;
  };

  const items = generatePlaybookItems();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending': return <Clock className="h-3 w-3 text-amber-600" />;
      case 'future': return <AlertCircle className="h-3 w-3 text-gray-400" />;
      default: return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <PlayCircle className="h-4 w-4 text-green-600 mr-2" />
        Deal Playbook
      </h3>
      
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 text-sm">
            {getStatusIcon(item.status)}
            <span className={`flex-1 ${
              item.status === 'completed' ? 'text-gray-600 line-through' : 
              item.priority === 'high' ? 'text-gray-900 font-medium' : 'text-gray-700'
            }`}>
              {item.text}
            </span>
            {item.priority === 'high' && item.status === 'pending' && (
              <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                NEXT
              </span>
            )}
          </div>
        ))}
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
    pdlData?.dealValue || null;
    
  const dealStage = apolloData?.deals?.[0]?.status || 
    pdlData?.currentStage || 
    'Discovery';
    
  const dealRisk = pdlData?.dealScore ? 
    (pdlData.dealScore >= 70 ? 'Low' : 
     pdlData.dealScore >= 40 ? 'Medium' : 'High') : 
    'Medium';
    
  const winProbability = pdlData?.dealScore || 25;
  const overdueCount = 2;
  const thisWeekTasks = 3;
  const weeksToClose = 12;
  
  const nextAction = "Schedule discovery call to understand business needs";

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Compact Header */}
      <CompactDealHeader 
        displayName={displayName}
        dealValue={dealValue}
        dealRisk={dealRisk}
        nextAction={nextAction}
      />
      
      {/* Compact Metrics - Remove WIN PROB card */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <CompactMetricCard
          title="THIS WEEK"
          value={thisWeekTasks}
          subtitle="Scheduled"
          icon={Calendar}
          color="blue"
        />
        <CompactMetricCard
          title="OVERDUE" 
          value={overdueCount}
          subtitle="Follow-ups"
          icon={AlertTriangle}
          color="red"
          urgency={overdueCount > 0 ? 'urgent' : 'normal'}
        />
        <CompactMetricCard
          title="TIMELINE"
          value={`${weeksToClose}wks`}
          subtitle="Est. Close"
          icon={Timer}
          color="blue"
        />
      </div>
      
      {/* Main Content Grid - 3 Columns */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          <EngagementStrategy researchData={researchData} />
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
          />
          <ContactStrategy 
            apolloData={apolloData}
            pdlData={pdlData}
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
          
          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Activity className="h-4 w-4 text-gray-600 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Intelligence gathered</span>
                <span className="ml-auto text-xs">Today</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Company research completed</span>
                <span className="ml-auto text-xs">Today</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>AI analysis generated</span>
                <span className="ml-auto text-xs">Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;