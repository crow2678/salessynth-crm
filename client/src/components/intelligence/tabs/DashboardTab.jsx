// tabs/DashboardTab.jsx
import React from 'react';
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
  Users
} from 'lucide-react';
import { GoogleNewsCard } from '../common/CommonComponents';
import { formatMarkdown } from '../utils/intelligenceUtils';

// Dashboard-specific components
const CompanyDashboardCard = ({ data, pdlData }) => {
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
  
  const topGrowthIndicator = insights.growthIndicators && insights.growthIndicators.length > 0 
    ? insights.growthIndicators[0] : null;
  const topBuyingSignal = insights.buyingSignals && insights.buyingSignals.length > 0
    ? insights.buyingSignals[0] : null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{companyInfo.name}</h3>
          <p className="text-sm text-gray-600">{companyInfo.industry}</p>
        </div>
        
        {companyInfo.linkedinUrl && (
          <a 
            href={`https://${companyInfo.linkedinUrl}`.replace(/^https:\/\/https:\/\//, 'https://')} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-gray-500">Size</p>
          <p className="font-medium">{companyInfo.size}</p>
        </div>
        
        {companyInfo.type ? (
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium capitalize">{companyInfo.type}</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-500">Revenue</p>
            <p className="font-medium">{companyInfo.revenue}</p>
          </div>
        )}
      </div>
      
      {(topGrowthIndicator || topBuyingSignal || funding.lastFunding) && (
        <div className="border-t pt-3 space-y-2">
          {topGrowthIndicator && (
            <div className="flex items-start">
              <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-700">{topGrowthIndicator}</p>
            </div>
          )}
          
          {topBuyingSignal && (
            <div className="flex items-start">
              <Zap className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-700">{topBuyingSignal}</p>
            </div>
          )}
          
          {funding.lastFunding && (
            <div className="flex items-start">
              <Award className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                {funding.lastFunding.type} funding: {funding.lastFunding.amount}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const KeyPeopleDashboardCard = ({ people = [], pdlPerson = null }) => {
  let displayPeople = [];
  
  if (pdlPerson && pdlPerson.data) {
    const personData = pdlPerson.data;
    displayPeople.push({
      name: personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`,
      title: personData.job_title || 'Unknown Title',
      email: null,
      emailStatus: null,
      linkedinUrl: personData.linkedin_url,
      isPrimary: true
    });
  }
  
  if (people && people.length > 0) {
    displayPeople = [...displayPeople, ...people.slice(0, Math.max(0, 3 - displayPeople.length))];
  }
  
  if (displayPeople.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mt-4">
      <h3 className="font-bold text-lg text-gray-900 mb-4">Key Decision Makers</h3>
      
      <div className="space-y-3">
        {displayPeople.map((person, idx) => (
          <div key={idx} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{person.name}</p>
              <p className="text-xs text-gray-500 truncate">{person.title}</p>
            </div>
            {person.email && person.emailStatus === 'verified' && (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" title="Verified Email" />
            )}
            {person.linkedinUrl && (
              <a 
                href={`https://${person.linkedinUrl}`.replace(/^https:\/\/https:\/\//, 'https://')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        ))}
      </div>
      
      {people.length > 3 - (pdlPerson && pdlPerson.data ? 1 : 0) && (
        <div className="mt-3 text-center">
          <button className="text-xs text-blue-600 hover:text-blue-800">
            View all {people.length + (pdlPerson && pdlPerson.data ? 1 : 0)} contacts
          </button>
        </div>
      )}
    </div>
  );
};

const DealInsightPreview = ({ pdlData }) => {
  if (!pdlData || !pdlData.dealScore) return null;
  
  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-blue-600";
    if (score >= 30) return "text-yellow-600";
    return "text-orange-600";
  };
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(pdlData.dealScore || 0)}`}>
            {pdlData.dealScore || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Success Probability</div>
        </div>
        <div className="h-12 w-px bg-gray-200"></div>
        <div>
          <div className="text-sm font-medium text-gray-800">{pdlData.currentStage || "Early Stage"}</div>
          <div className="text-xs text-gray-500 mt-1">Current Stage</div>
        </div>
        <div className="h-12 w-px bg-gray-200"></div>
        <div>
          <div className="text-sm font-bold text-green-600">{pdlData.dealValue || "Unknown"}</div>
          <div className="text-xs text-gray-500 mt-1">Potential Value</div>
        </div>
      </div>
      
      <div>
        <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center text-sm">
          <Rocket className="w-4 h-4 mr-1" />
          Deal Analysis
        </button>
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
  const isPdlDataAvailable = pdlData && Object.keys(pdlData).length > 0 && pdlData.dealScore > 0;

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Key Sales Insights</h3>
              <button 
                onClick={() => handleTabClick('deal-intelligence')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View Details <ChevronRight size={16} />
              </button>
            </div>
            
            {isSummaryAvailable ? (
              <div className="prose prose-blue max-w-none prose-sm">
                <div dangerouslySetInnerHTML={{ 
                  __html: formatMarkdown(researchData.summary) 
                }} />
              </div>
            ) : (
              <div className="text-center py-10">
                <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">AI analysis is being generated...</p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Deal Intelligence</h3>
              <button 
                onClick={() => handleTabClick('deal-intelligence')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View Details <ChevronRight size={16} />
              </button>
            </div>
            
            {isPdlDataAvailable ? (
              <DealInsightPreview pdlData={pdlData} />
            ) : (
              <div className="text-center py-8">
                <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Deal intelligence is being generated...</p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Latest News</h3>
              {areGoogleResultsAvailable && (
                <button 
                  onClick={() => handleTabClick('web')}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All <ChevronRight size={16} />
                </button>
              )}
            </div>
            
            {areGoogleResultsAvailable ? (
              <div>
                {googleData.slice(0, 3).map((item, index) => (
                  <GoogleNewsCard key={index} item={item} compact={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No news articles available yet</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {(isApolloDataAvailable || isPdlDataAvailable) ? (
            <>
              <CompanyDashboardCard data={apolloData} pdlData={pdlData} />
              <KeyPeopleDashboardCard 
                people={apolloData?.keyPeople || []} 
                pdlPerson={pdlData?.personData} 
              />
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center py-8">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700">{displayName}</h3>
              <p className="text-gray-500 mt-2">Company profile is being generated</p>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Intelligence Sources</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isApolloDataAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">Company Data</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${areGoogleResultsAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">News Articles</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isSummaryAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">Sales Insights</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isPdlDataAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">Deal Intelligence</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start">
              <Calendar className="text-blue-500 mr-3 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900">Last Updated</h3>
                <p className="text-gray-600 text-sm mt-1">{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;