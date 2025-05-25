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
  Signal,
  Timer,
  Gauge
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

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon: IconComponent, color = 'blue', status }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      amber: 'border-amber-200 bg-amber-50',
      red: 'border-red-200 bg-red-50',
      purple: 'border-purple-200 bg-purple-50',
      gray: 'border-gray-200 bg-gray-50'
    };
    return colors[color] || colors.blue;
  };

  const getTextColor = (color) => {
    const colors = {
      blue: 'text-blue-700',
      green: 'text-green-700',
      amber: 'text-amber-700',
      red: 'text-red-700',
      purple: 'text-purple-700',
      gray: 'text-gray-700'
    };
    return colors[color] || colors.blue;
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      amber: 'text-amber-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
      gray: 'text-gray-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={`bg-white border-2 ${getColorClasses(color)} rounded-xl p-6 text-center hover:shadow-md transition-all duration-200`}>
      <div className="flex justify-center mb-3">
        <div className={`p-3 ${getColorClasses(color)} rounded-full`}>
          <IconComponent className={`h-6 w-6 ${getIconColor(color)}`} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${getTextColor(color)} mb-1`}>
        {value}
      </div>
      <div className="text-sm font-medium text-gray-600 mb-1">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500">
          {subtitle}
        </div>
      )}
      {status && (
        <div className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          status.type === 'positive' ? 'bg-green-100 text-green-800' :
          status.type === 'warning' ? 'bg-amber-100 text-amber-800' :
          status.type === 'negative' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status.label}
        </div>
      )}
    </div>
  );
};

// Header Section
const DashboardHeader = ({ displayName, lastUpdated }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{toTitleCase(displayName)}</h1>
            <p className="text-gray-600">Intelligence Center</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last Updated</div>
          <div className="font-medium text-gray-900">
            {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Not available'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced AI Insights Card
const AIInsightsCard = ({ researchData, handleTabClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSummary = researchData?.summary;

  if (!hasSummary) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Brain className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-2">AI Analysis in Progress</h3>
        <p className="text-gray-500 text-sm mb-4">Our AI is analyzing your client data to generate actionable sales insights</p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
          <span>Generating insights...</span>
        </div>
      </div>
    );
  }

  // Extract key points from the summary
  const summaryText = researchData.summary;
  const keyPoints = summaryText.split('*').filter(point => point.trim().length > 20).slice(0, 4);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xl text-gray-900 flex items-center">
          <Brain className="h-6 w-6 text-purple-600 mr-3" />
          AI-Generated Insights
        </h3>
        <div className="flex items-center space-x-3">
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
            AI Powered
          </span>
          <button 
            onClick={() => handleTabClick('deal')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
          >
            Full Analysis
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
      
      {/* Key Insights Grid */}
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        {keyPoints.map((point, idx) => (
          <div key={idx} className="flex items-start bg-purple-50 rounded-lg p-4">
            <div className="p-1.5 bg-purple-100 rounded-full mr-3 mt-0.5">
              <Star className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm text-purple-800 leading-relaxed">
              {point.trim().replace(/^[•\-\*\s]+/, '')}
            </span>
          </div>
        ))}
      </div>
      
      {/* Expandable Full Summary */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: formatMarkdown(summaryText) 
            }} />
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center py-2 mt-3 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
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

// Enhanced Company Card
const CompanyOverviewCard = ({ data, pdlData, handleTabClick }) => {
  const companyInfo = {
    name: pdlData?.companyData?.display_name || pdlData?.companyData?.name || 
          data?.company?.name || "Unknown Company",
    industry: pdlData?.companyData?.industry || data?.company?.industry || "Unknown Industry",
    size: pdlData?.companyData?.employee_count ? 
          `${pdlData.companyData.employee_count.toLocaleString()} employees` : 
          pdlData?.companyData?.size || data?.company?.size || "Unknown size",
    revenue: data?.company?.revenue || "Unknown",
    location: pdlData?.companyData?.location ? 
              [pdlData.companyData.location.locality, pdlData.companyData.location.region]
                .filter(Boolean).join(', ') : 
              [data?.company?.location?.city, data?.company?.location?.state]
                .filter(Boolean).join(', ') || "Unknown location",
    website: pdlData?.companyData?.website || data?.company?.website || null
  };
  
  const insights = data?.insights || {};
  const hasSignals = (insights.growthIndicators?.length > 0) || (insights.buyingSignals?.length > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
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
        
        <button 
          onClick={() => handleTabClick('company')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
        >
          Full Profile
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
      
      {/* Company Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">{companyInfo.size}</div>
          <div className="text-xs text-gray-500">Company Size</div>
        </div>
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">{toTitleCase(companyInfo.location)}</div>
          <div className="text-xs text-gray-500">Location</div>
        </div>
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">{companyInfo.revenue}</div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
      </div>
      
      {/* Opportunity Signals */}
      {hasSignals && (
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
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Key People Card
const KeyPeopleCard = ({ people = [], pdlPerson = null, handleTabClick }) => {
  let displayPeople = [];
  
  if (pdlPerson && pdlPerson.data) {
    const personData = pdlPerson.data;
    displayPeople.push({
      name: personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`,
      title: personData.job_title || 'Unknown Title',
      email: personData.emails?.[0]?.address || null,
      linkedinUrl: personData.linkedin_url,
      isPrimary: true
    });
  }
  
  if (people && people.length > 0) {
    displayPeople = [...displayPeople, ...people.slice(0, Math.max(0, 3 - displayPeople.length))];
  }
  
  if (displayPeople.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-2">No Contacts Available</h3>
        <p className="text-gray-500 text-sm">Contact information will appear here when available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xl text-gray-900 flex items-center">
          <Users className="h-6 w-6 text-green-600 mr-3" />
          Key Contacts
        </h3>
        <button 
          onClick={() => handleTabClick('profile')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
      
      <div className="space-y-4">
        {displayPeople.slice(0, 3).map((person, idx) => {
          const initials = person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          
          return (
            <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-gray-900">{toTitleCase(person.name)}</p>
                  {person.isPrimary && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Primary</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{toTitleCase(person.title)}</p>
              </div>
              <div className="flex items-center space-x-2">
                {person.email && (
                  <div className="p-1.5 bg-blue-100 rounded-full" title="Email Available">
                    <Mail className="h-3 w-3 text-blue-600" />
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
    </div>
  );
};

// Intelligence Status Card
const IntelligenceStatusCard = ({ researchData, googleData, apolloData, pdlData }) => {
  const sources = [
    { name: 'Company Data', status: apolloData && Object.keys(apolloData).length > 0, icon: Building },
    { name: 'News Articles', status: googleData && Array.isArray(googleData) && googleData.length > 0, icon: MessageSquare },
    { name: 'AI Insights', status: researchData?.summary, icon: Brain },
    { name: 'Deal Intelligence', status: pdlData && Object.keys(pdlData).length > 0, icon: BarChart3 }
  ];

  const completedSources = sources.filter(source => source.status).length;
  const completionPercentage = Math.round((completedSources / sources.length) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xl text-gray-900 flex items-center">
          <Signal className="h-6 w-6 text-blue-600 mr-3" />
          Intelligence Status
        </h3>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>
      
      <div className="space-y-4 mb-4">
        {sources.map((source, idx) => {
          const IconComponent = source.icon;
          return (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${source.status ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <IconComponent className={`h-4 w-4 ${source.status ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{source.name}</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${source.status ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
          );
        })}
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Collection Progress</span>
          <span>{completedSources}/{sources.length} sources</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
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
  // Calculate metrics with proper fallbacks
  const dealScore = pdlData?.dealScore || 0;
  const currentStage = pdlData?.currentStage || apolloData?.deals?.[0]?.status || "Discovery";
  const dealValue = pdlData?.dealValue || apolloData?.deals?.[0]?.value ? `$${apolloData.deals[0].value.toLocaleString()}` : "Unknown";
  
  // Determine health status based on deal score
  const getHealthStatus = (score) => {
    if (score >= 70) return { label: 'Excellent', type: 'positive', color: 'green' };
    if (score >= 50) return { label: 'Good', type: 'positive', color: 'blue' };
    if (score >= 30) return { label: 'Fair', type: 'warning', color: 'amber' };
    if (score > 0) return { label: 'Needs Attention', type: 'warning', color: 'red' };
    return { label: 'Analyzing', type: 'neutral', color: 'gray' };
  };

  const healthStatus = getHealthStatus(dealScore);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <DashboardHeader displayName={displayName} lastUpdated={lastUpdated} />
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Deal Success"
          value={`${dealScore}%`}
          subtitle="Success Probability"
          icon={Target}
          color={healthStatus.color}
          status={healthStatus}
        />
        <MetricCard
          title="Current Stage"
          value={toTitleCase(currentStage)}
          subtitle="Deal Phase"
          icon={Timer}
          color="blue"
        />
        <MetricCard
          title="Deal Value"
          value={dealValue}
          subtitle="Potential Revenue"
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Health Score"
          value={healthStatus.label}
          subtitle="Overall Status"
          icon={Gauge}
          color={healthStatus.color}
          status={healthStatus}
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Large AI Insights Card */}
        <div className="lg:col-span-2">
          <AIInsightsCard 
            researchData={researchData}
            handleTabClick={handleTabClick}
          />
        </div>
        
        {/* Intelligence Status Card */}
        <div>
          <IntelligenceStatusCard 
            researchData={researchData}
            googleData={googleData}
            apolloData={apolloData}
            pdlData={pdlData}
          />
        </div>
      </div>
      
      {/* Secondary Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Company Card */}
        <div>
          <CompanyOverviewCard 
            data={apolloData}
            pdlData={pdlData}
            handleTabClick={handleTabClick}
          />
        </div>
        
        {/* People Card */}
        <div>
          <KeyPeopleCard 
            people={apolloData?.keyPeople || []}
            pdlPerson={pdlData?.personData}
            handleTabClick={handleTabClick}
          />
        </div>
        
        {/* News & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <Rocket className="h-5 w-5 text-blue-600 mr-2" />
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleTabClick('deal')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-3" />
                  <span>Deal Analysis</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <button 
                onClick={() => handleTabClick('company')}
                className="w-full bg-green-50 hover:bg-green-100 text-green-600 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-3" />
                  <span>Company Research</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Latest News */}
          {googleData && Array.isArray(googleData) && googleData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
                  Latest News
                </h3>
                <button 
                  onClick={() => handleTabClick('web')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="space-y-3">
                {googleData.slice(0, 2).map((item, index) => (
                  <GoogleNewsCard key={index} item={item} compact={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;