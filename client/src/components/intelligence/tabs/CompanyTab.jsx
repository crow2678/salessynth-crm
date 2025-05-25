// tabs/CompanyTab.jsx
import React from 'react';
import { 
  Building, 
  Briefcase, 
  DollarSign, 
  Globe, 
  Link, 
  ExternalLink, 
  Calendar, 
  TrendingUp, 
  Mail, 
  Phone, 
  Database, 
  Award, 
  CheckCircle, 
  Zap, 
  Users,
  MapPin,
  Star,
  Shield
} from 'lucide-react';
import { NoCompanyDisplay } from '../common/CommonComponents';

// Utility function to convert text to title case
const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Utility function to format numbers
const formatNumber = (num) => {
  if (!num) return 'Unknown';
  if (typeof num === 'string' && num.toLowerCase() === 'unknown') return 'Unknown';
  if (typeof num === 'number') return num.toLocaleString();
  return num;
};

// Utility function to format location
const formatLocation = (location) => {
  if (!location) return 'Unknown';
  if (typeof location === 'string') return toTitleCase(location);
  
  const parts = [];
  if (location.locality) parts.push(toTitleCase(location.locality));
  if (location.city) parts.push(toTitleCase(location.city));
  if (location.region) parts.push(toTitleCase(location.region));
  if (location.state) parts.push(toTitleCase(location.state));
  if (location.country) parts.push(toTitleCase(location.country));
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
};

const TechnologyStackDisplay = ({ technologies = {} }) => {
  if (!technologies || !technologies.categories || technologies.categories.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Database className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 font-medium">No Technology Data Available</p>
        <p className="text-xs text-gray-400 mt-1">Technology stack information will appear here when available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Database className="h-5 w-5 mr-2 text-blue-600" />
          Technology Stack
        </h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {technologies.count || technologies.categories.length} Technologies
        </span>
      </div>
      
      <div className="grid gap-4">
        {technologies.categories.map((category, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all duration-200">
            <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              {toTitleCase(category.category)}
            </div>
            <div className="flex flex-wrap gap-2">
              {category.technologies.map((tech, techIdx) => (
                <span 
                  key={techIdx} 
                  className="bg-white border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors duration-150"
                >
                  {toTitleCase(tech)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const KeyPeopleList = ({ people = [] }) => {
  if (!people || people.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Users className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 font-medium">No Key People Identified</p>
        <p className="text-xs text-gray-400 mt-1">Decision maker information will appear here when available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Key Decision Makers
        </h3>
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {people.length} {people.length === 1 ? 'Contact' : 'Contacts'}
        </span>
      </div>
      
      <div className="grid gap-4">
        {people.map((person, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{toTitleCase(person.name)}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{toTitleCase(person.title)}</p>
                  </div>
                  {person.seniority && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {toTitleCase(person.seniority.replace(/_/g, ' '))}
                    </span>
                  )}
                </div>
                
                <div className="mt-3 flex flex-wrap gap-3">
                  {person.email && (
                    <div className="flex items-center text-xs bg-gray-50 px-3 py-1.5 rounded-full">
                      <Mail className="h-3 w-3 mr-1.5 text-gray-500" />
                      <span className="text-gray-700 font-medium">{person.email}</span>
                      {person.emailStatus === 'verified' && (
                        <CheckCircle className="h-3 w-3 ml-1.5 text-green-500" />
                      )}
                    </div>
                  )}
                  
                  {person.linkedinUrl && (
                    <a 
                      href={person.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-colors duration-150"
                    >
                      <Link className="h-3 w-3 mr-1.5" />
                      <span className="font-medium">LinkedIn Profile</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BuyingSignalsCard = ({ insights }) => {
  if (!insights || (!insights.buyingSignals || insights.buyingSignals.length === 0) && 
      (!insights.growthIndicators || insights.growthIndicators.length === 0)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-yellow-500 rounded-full mr-3">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-bold text-xl text-gray-800">Opportunity Signals</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {insights.buyingSignals && insights.buyingSignals.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Buying Signals
            </h4>
            <ul className="space-y-2">
              {insights.buyingSignals.map((signal, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700 leading-relaxed">{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {insights.growthIndicators && insights.growthIndicators.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Growth Indicators
            </h4>
            <ul className="space-y-2">
              {insights.growthIndicators.map((indicator, idx) => (
                <li key={idx} className="flex items-start">
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700 leading-relaxed">{indicator}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const CompanyProfile = ({ data, pdlData }) => {
  if (pdlData?.companyData) {
    const companyData = pdlData.companyData;
    
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Building className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="font-bold text-2xl text-gray-900">
                  {toTitleCase(companyData.display_name || companyData.name || pdlData.company || "Unknown Company")}
                </h3>
              </div>
              <p className="text-lg text-gray-600 font-medium">{toTitleCase(companyData.industry || "Industry Not Available")}</p>
            </div>
            <div className="flex space-x-2">
              {companyData.linkedin_url && (
                <a 
                  href={`https://${companyData.linkedin_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition-colors duration-150"
                  title="LinkedIn"
                >
                  <Link className="h-5 w-5" />
                </a>
              )}
              {companyData.website && (
                <a 
                  href={companyData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-colors duration-150"
                  title="Website"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Briefcase className="h-5 w-5 text-gray-500 mr-2" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Size</p>
              </div>
              <p className="font-bold text-lg text-gray-900">
                {companyData.employee_count 
                  ? `${formatNumber(companyData.employee_count)} Employees` 
                  : toTitleCase(companyData.size) || 'Unknown'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Headquarters</p>
              </div>
              <p className="font-bold text-lg text-gray-900">
                {formatLocation(companyData.location)}
              </p>
            </div>
            
            {companyData.type && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-gray-500 mr-2" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Type</p>
                </div>
                <p className="font-bold text-lg text-gray-900">{toTitleCase(companyData.type)}</p>
              </div>
            )}
            
            {companyData.founded && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Founded</p>
                </div>
                <p className="font-bold text-lg text-gray-900">{companyData.founded}</p>
              </div>
            )}
          </div>
          
          {companyData.summary && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Company Description</h4>
              <p className="text-gray-700 leading-relaxed">{companyData.summary}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (!data) return <NoCompanyDisplay companyName="Unknown Company" />;
  
  const companyInfo = data.company || {};
  const keyPeople = data.keyPeople || [];
  const technologies = data.technologies || {};
  const insights = data.insights || {};
  const funding = data.funding || {};
  
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Building className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="font-bold text-2xl text-gray-900">{toTitleCase(companyInfo.name)}</h3>
            </div>
            <p className="text-lg text-gray-600 font-medium">{toTitleCase(companyInfo.industry)}</p>
          </div>
          <div className="flex space-x-2">
            {companyInfo.socialProfiles?.linkedin && (
              <a 
                href={companyInfo.socialProfiles.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition-colors duration-150"
                title="LinkedIn"
              >
                <Link className="h-5 w-5" />
              </a>
            )}
            {companyInfo.website && (
              <a 
                href={companyInfo.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-colors duration-150"
                title="Website"
              >
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Briefcase className="h-5 w-5 text-gray-500 mr-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Size</p>
            </div>
            <p className="font-bold text-lg text-gray-900">
              {formatNumber(companyInfo.size)} {companyInfo.size && companyInfo.size !== 'Unknown' ? 'Employees' : ''}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annual Revenue</p>
            </div>
            <p className="font-bold text-lg text-gray-900">{toTitleCase(companyInfo.revenue) || 'Unknown'}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <MapPin className="h-5 w-5 text-gray-500 mr-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Headquarters</p>
            </div>
            <p className="font-bold text-lg text-gray-900">
              {formatLocation(companyInfo.location)}
            </p>
          </div>
          
          {funding.totalRaised && funding.totalRaised !== 'Unknown' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Award className="h-5 w-5 text-gray-500 mr-2" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Funding</p>
              </div>
              <p className="font-bold text-lg text-gray-900">{funding.totalRaised}</p>
            </div>
          )}
        </div>
        
        {companyInfo.description && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Company Description</h4>
            <p className="text-gray-700 leading-relaxed">{companyInfo.description}</p>
          </div>
        )}
        
        {funding.lastFunding && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full mr-3 flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Recent {toTitleCase(funding.lastFunding.type)} Funding
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {funding.lastFunding.amount} • {new Date(funding.lastFunding.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <BuyingSignalsCard insights={insights} />
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <TechnologyStackDisplay technologies={technologies} />
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <KeyPeopleList people={keyPeople} />
      </div>
    </div>
  );
};

const CompanyTab = ({ apolloData, pdlData, displayName }) => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Company Profile</h2>
        <p className="text-gray-600">Comprehensive company intelligence and insights</p>
      </div>
      
      {apolloData || pdlData ? (
        <CompanyProfile data={apolloData} pdlData={pdlData} />
      ) : (
        <NoCompanyDisplay companyName={displayName} />
      )}
    </div>
  );
};

export default CompanyTab;