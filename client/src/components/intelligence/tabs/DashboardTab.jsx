// tabs/DashboardTab.jsx
import React, { useState } from 'react';
import { 
  Brain, 
  ChevronRight, 
  Rocket, 
  Search, 
  Building, 
  Calendar,
  TrendingUp,
  ExternalLink,
  Zap,
  Award,
  Link,
  CheckCircle,
  Mail,
  Users,
  ArrowRight,
  Activity,
  Target,
  Clock,
  DollarSign,
  Star,
  AlertCircle,
  TrendingDown,
  BarChart3,
  Eye,
  MessageSquare,
  Phone,
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Briefcase,
  Signal
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

// Circular Progress Component for Dashboard
const DashboardCircularProgress = ({ percentage, size = 80, strokeWidth = 6, label, sublabel }) => {
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
    <div className="flex flex-col items-center">
      <div className="relative">
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
            <div className="text-lg font-bold text-gray-900">{percentage}%</div>
          </div>
        </div>
      </div>
      {label && (
        <div className="text-center mt-2">
          <div className="text-sm font-medium text-gray-700">{label}</div>
          {sublabel && <div className="text-xs text-gray-500">{sublabel}</div>}
        </div>
      )}
    </div>
  );
};

// Enhanced Hero Section
const IntelligenceHero = ({ researchData, pdlData, displayName, lastUpdated, handleTabClick }) => {
  const dealScore = pdlData?.dealScore || 0;
  const currentStage = pdlData?.currentStage || "Discovery";
  const dealValue = pdlData?.dealValue || "Unknown";
  
  const getHealthStatus = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 40) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const healthStatus = getHealthStatus(dealScore);
  const hasSummary = researchData?.summary;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white mb-6">
      <div className="grid lg:grid-cols-4 gap-6 items-center">
        {/* Client Overview */}
        <div className="lg:col-span-2">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-white/10 rounded-lg mr-3">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{toTitleCase(displayName)}</h1>
              <p className="text-blue-100">Intelligence Center</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xl font-bold">{dealScore}%</div>
              <div className="text-xs text-blue-100">Success Rate</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xl font-bold">{toTitleCase(currentStage)}</div>
              <div className="text-xs text-blue-100">Current Stage</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xl font-bold">{dealValue}</div>
              <div className="text-xs text-blue-100">Deal Value</div>
            </div>
          </div>
        </div>

        {/* Deal Health Visualization */}
        <div className="flex justify-center">
          <DashboardCircularProgress 
            percentage={dealScore} 
            size={100} 
            label="Deal Health"
            sublabel={healthStatus.label}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <button 
            onClick={() => handleTabClick('deal')}
            className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Deal Analysis
          </button>
          <button 
            onClick={() => handleTabClick('company')}
            className="w-full bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors duration-200 flex items-center justify-center"
          >
            <Building className="h-4 w-4 mr-2" />
            Company Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Company Card
const EnhancedCompanyCard = ({ data, pdlData, handleTabClick }) => {
  const companyInfo = {
    name: pdlData?.companyData?.display_name || pdlData?.companyData?.name || 
          data?.company?.name || "Unknown Company",
    industry: pdlData?.companyData?.industry || data?.company?.industry || "Unknown Industry",
    size: pdlData?.companyData?.employee_count ? 
          `${pdlData.companyData.employee_count.toLocaleString()} employees` : 
          pdlData?.companyData?.size || data?.company?.size || "Unknown size",
    revenue: data?.company?.revenue || "Unknown revenue",
    location: pdlData?.companyData?.location ? 
              [pdlData.companyData.location.locality, pdlData.companyData.location.region]
                .filter(Boolean).join(', ') : 
              [data?.company?.location?.city, data?.company?.location?.state]
                .filter(Boolean).join(', ') || "Unknown location",
    linkedinUrl: pdlData?.companyData?.linkedin_url || data?.company?.socialProfiles?.linkedin || null,
    website: pdlData?.companyData?.website || data?.company?.website || null,
    type: pdlData?.companyData?.type || null
  };
  
  const insights = data?.insights || {};
  const funding = data?.funding || {};
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg mr-4">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-900 mb-1">{toTitleCase(companyInfo.name)}</h3>
            <p className="text-gray-600">{toTitleCase(companyInfo.industry)}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {companyInfo.website && (
            <a 
              href={companyInfo.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
              title="Company Website"
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
          {companyInfo.linkedinUrl && (
            <a 
              href={`https://${companyInfo.linkedinUrl}`.replace(/^https:\/\/https:\/\//, 'https://')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition-colors"
              title="LinkedIn Profile"
            >
              <Link className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      
      {/* Company Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Users className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company Size</span>
          </div>
          <p className="font-semibold text-gray-900">{companyInfo.size}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</span>
          </div>
          <p className="font-semibold text-gray-900">{toTitleCase(companyInfo.location)}</p>
        </div>
        
        {companyInfo.type && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Briefcase className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</span>
            </div>
            <p className="font-semibold text-gray-900">{toTitleCase(companyInfo.type)}</p>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</span>
          </div>
          <p className="font-semibold text-gray-900">{companyInfo.revenue}</p>
        </div>
      </div>
      
      {/* Opportunity Signals */}
      {(insights.growthIndicators?.length > 0 || insights.buyingSignals?.length > 0 || funding.lastFunding) && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Zap className="h-4 w-4 text-amber-500 mr-2" />
            Opportunity Signals
          </h4>
          <div className="space-y-2">
            {insights.growthIndicators?.slice(0, 1).map((indicator, idx) => (
              <div key={idx} className="flex items-start bg-green-50 rounded-lg p-3">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-green-800">{indicator}</span>
              </div>
            ))}
            
            {insights.buyingSignals?.slice(0, 1).map((signal, idx) => (
              <div key={idx} className="flex items-start bg-blue-50 rounded-lg p-3">
                <Target className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-blue-800">{signal}</span>
              </div>
            ))}
            
            {funding.lastFunding && (
              <div className="flex items-start bg-purple-50 rounded-lg p-3">
                <Award className="h-4 w-4 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-purple-800">
                  Recent {toTitleCase(funding.lastFunding.type)} funding: {funding.lastFunding.amount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* View Full Profile Button */}
      <button 
        onClick={() => handleTabClick('company')}
        className="w-full mt-4 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
      >
        View Full Profile
        <ArrowRight className="h-4 w-4 ml-2" />
      </button>
    </div>
  );
};

// Enhanced Key People Card
const EnhancedKeyPeopleCard = ({ people = [], pdlPerson = null, handleTabClick }) => {
  const [showAll, setShowAll] = useState(false);
  
  let displayPeople = [];
  
  if (pdlPerson && pdlPerson.data) {
    const personData = pdlPerson.data;
    displayPeople.push({
      name: personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`,
      title: personData.job_title || 'Unknown Title',
      email: personData.emails?.[0]?.address || null,
      emailStatus: personData.emails?.[0]?.type || null,
      linkedinUrl: personData.linkedin_url,
      isPrimary: true
    });
  }
  
  if (people && people.length > 0) {
    displayPeople = [...displayPeople, ...people.slice(0, Math.max(0, 5 - displayPeople.length))];
  }
  
  if (displayPeople.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-2">No Contacts Available</h3>
        <p className="text-gray-500 text-sm">Contact information will appear here when available</p>
      </div>
    );
  }
  
  const visiblePeople = showAll ? displayPeople : displayPeople.slice(0, 3);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-900 flex items-center">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          Key Contacts
        </h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
          {displayPeople.length} {displayPeople.length === 1 ? 'Contact' : 'Contacts'}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        {visiblePeople.map((person, idx) => {
          const initials = person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          
          return (
            <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">{toTitleCase(person.name)}</p>
                  {person.isPrimary && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Primary</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{toTitleCase(person.title)}</p>
              </div>
              <div className="flex items-center space-x-2">
                {person.email && (
                  <div className="p-1.5 bg-green-100 rounded-full" title="Email Available">
                    <Mail className="h-3 w-3 text-green-600" />
                  </div>
                )}
                {person.linkedinUrl && (
                  <a 
                    href={`https://${person.linkedinUrl}`.replace(/^https:\/\/https:\/\//, 'https://')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                    title="LinkedIn Profile"
                  >
                    <Link className="h-3 w-3 text-blue-600" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {displayPeople.length > 3 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center py-2"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show {displayPeople.length - 3} More
            </>
          )}
        </button>
      )}
      
      <button 
        onClick={() => handleTabClick('profile')}
        className="w-full mt-3 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
      >
        View All Contacts
        <ArrowRight className="h-4 w-4 ml-2" />
      </button>
    </div>
  );
};

// Enhanced Sales Insights Card
const EnhancedSalesInsightsCard = ({ researchData, handleTabClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSummary = researchData?.summary;

  if (!hasSummary) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Brain className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-2">AI Analysis in Progress</h3>
        <p className="text-gray-500 text-sm mb-4">Our AI is analyzing your client data to generate actionable sales insights</p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Generating insights...</span>
        </div>
      </div>
    );
  }

  // Extract key points from the summary (simplified approach)
  const summaryText = researchData.summary;
  const keyPoints = summaryText.split('*').filter(point => point.trim().length > 20).slice(0, 3);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-900 flex items-center">
          <Brain className="h-5 w-5 text-purple-600 mr-2" />
          AI-Generated Insights
        </h3>
        <div className="flex items-center space-x-2">
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
            AI Powered
          </span>
          <button 
            onClick={() => handleTabClick('deal')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            View Full Analysis
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
      
      {/* Key Insights Preview */}
      <div className="space-y-3 mb-4">
        {keyPoints.map((point, idx) => (
          <div key={idx} className="flex items-start bg-purple-50 rounded-lg p-3">
            <div className="p-1 bg-purple-100 rounded-full mr-3 mt-0.5">
              <Star className="h-3 w-3 text-purple-600" />
            </div>
            <span className="text-sm text-purple-800 leading-relaxed">
              {point.trim().replace(/^[•\-\*\s]+/, '')}
            </span>
          </div>
        ))}
      </div>
      
      {/* Full Summary (Expandable) */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: formatMarkdown(summaryText) 
            }} />
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center py-2 mt-2"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4 mr-1" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            Read Full Analysis
          </>
        )}
      </button>
    </div>
  );
};

// Enhanced News Card
const EnhancedNewsCard = ({ googleData, handleTabClick }) => {
  if (!googleData || !Array.isArray(googleData) || googleData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-2">No Recent News</h3>
        <p className="text-gray-500 text-sm">News articles will appear here when available</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-900 flex items-center">
          <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
          Latest News
        </h3>
        <div className="flex items-center space-x-2">
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            {googleData.length} Articles
          </span>
          <button 
            onClick={() => handleTabClick('web')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {googleData.slice(0, 3).map((item, index) => (
          <GoogleNewsCard key={index} item={item} compact={true} />
        ))}
      </div>
    </div>
  );
};

// Intelligence Status Card
const IntelligenceStatusCard = ({ researchData, googleData, apolloData, pdlData, lastUpdated }) => {
  const sources = [
    { 
      name: 'Company Data', 
      status: apolloData && Object.keys(apolloData).length > 0,
      icon: Building,
      color: 'blue'
    },
    { 
      name: 'News Articles', 
      status: googleData && Array.isArray(googleData) && googleData.length > 0,
      icon: MessageSquare,
      color: 'green'
    },
    { 
      name: 'AI Insights', 
      status: researchData?.summary,
      icon: Brain,
      color: 'purple'
    },
    { 
      name: 'Deal Intelligence', 
      status: pdlData && Object.keys(pdlData).length > 0 && pdlData.dealScore > 0,
      icon: BarChart3,
      color: 'amber'
    }
  ];

  const completedSources = sources.filter(source => source.status).length;
  const completionPercentage = Math.round((completedSources / sources.length) * 100);

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600',
      green: isActive ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600',
      purple: isActive ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600',
      amber: isActive ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 flex items-center">
          <Signal className="h-5 w-5 text-blue-600 mr-2" />
          Intelligence Status
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        {sources.map((source, idx) => {
          const IconComponent = source.icon;
          return (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${getColorClasses(source.color, source.status)}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">{source.name}</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${source.status ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Data Collection Progress</span>
          <span>{completedSources}/{sources.length} sources</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Last Updated */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-2" />
          <span>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Not available'}</span>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Tab Component
const DashboardTab = ({ 
  researchData, 
  googleData, 
  apolloData, 
  pdlData, 
  displayName, 
  lastUpdated, 
  handleTabClick 
}) => {
  const isSummaryAvailable = researchData?.summary;
  const areGoogleResultsAvailable = googleData && Array.isArray(googleData) && googleData.length > 0;
  const isApolloDataAvailable = apolloData && Object.keys(apolloData).length > 0;
  const isPdlDataAvailable = pdlData && Object.keys(pdlData).length > 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <IntelligenceHero 
        researchData={researchData}
        pdlData={pdlData}
        displayName={displayName}
        lastUpdated={lastUpdated}
        handleTabClick={handleTabClick}
      />
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Primary Content - Left Side */}
        <div className="lg:col-span-8 space-y-6">
          {/* Sales Insights Card */}
          <EnhancedSalesInsightsCard 
            researchData={researchData}
            handleTabClick={handleTabClick}
          />
          
          {/* Company Profile Card */}
          {(isApolloDataAvailable || isPdlDataAvailable) && (
            <EnhancedCompanyCard 
              data={apolloData}
              pdlData={pdlData}
              handleTabClick={handleTabClick}
            />
          )}
          
          {/* News Card */}
          <EnhancedNewsCard 
            googleData={googleData}
            handleTabClick={handleTabClick}
          />
        </div>
        
        {/* Secondary Content - Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Key People Card */}
          <EnhancedKeyPeopleCard 
            people={apolloData?.keyPeople || []}
            pdlPerson={pdlData?.personData}
            handleTabClick={handleTabClick}
          />
          
          {/* Intelligence Status Card */}
          <IntelligenceStatusCard 
            researchData={researchData}
            googleData={googleData}
            apolloData={apolloData}
            pdlData={pdlData}
            lastUpdated={lastUpdated}
          />
          
          {/* Quick Actions Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <Rocket className="h-5 w-5 text-blue-600 mr-2" />
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleTabClick('deal')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <BarChart3 className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Deal Analysis</div>
                  <div className="text-xs text-blue-500">View success factors & recommendations</div>
                </div>
              </button>
              
              <button 
                onClick={() => handleTabClick('company')}
                className="w-full bg-green-50 hover:bg-green-100 text-green-600 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <Building className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Company Research</div>
                  <div className="text-xs text-green-500">Deep dive into company profile</div>
                </div>
              </button>
              
              <button 
                onClick={() => handleTabClick('profile')}
                className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <Users className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Contact Profiles</div>
                  <div className="text-xs text-purple-500">View decision maker details</div>
                </div>
              </button>
              
              <button 
                onClick={() => handleTabClick('web')}
                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-600 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <Search className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Web Research</div>
                  <div className="text-xs text-amber-500">Latest news & mentions</div>
                </div>
              </button>
            </div>
          </div>
          
          {/* Tips & Recommendations */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
            <h3 className="font-bold text-lg text-indigo-900 mb-3 flex items-center">
              <Star className="h-5 w-5 text-indigo-600 mr-2" />
              Pro Tips
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-indigo-800">Check the Deal Intelligence tab for AI-powered success predictions</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-indigo-800">Review company signals to identify the best time to engage</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-indigo-800">Use contact profiles to understand decision-making hierarchy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;