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
  Users
} from 'lucide-react';
import { NoCompanyDisplay } from '../common/CommonComponents';

const TechnologyStackDisplay = ({ technologies = {} }) => {
  if (!technologies || !technologies.categories || technologies.categories.length === 0) {
    return (
      <div className="text-center py-4">
        <Database className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No technology data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-700">Technology Stack ({technologies.count || technologies.categories.length})</h3>
      <div className="space-y-3">
        {technologies.categories.map((category, idx) => (
          <div key={idx} className="border rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">{category.category}</div>
            <div className="flex flex-wrap gap-2">
              {category.technologies.map((tech, techIdx) => (
                <span 
                  key={techIdx} 
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                >
                  {tech}
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
      <div className="text-center py-4">
        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No key people identified</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-700">Key Decision Makers</h3>
      <div className="space-y-3">
        {people.map((person, idx) => (
          <div key={idx} className="border rounded-lg p-3 flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
              {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{person.name}</p>
              <p className="text-sm text-gray-600">{person.title}</p>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {person.email && (
                  <div className="flex items-center text-xs">
                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                    <span className="text-gray-600">
                      {person.email}
                      {person.emailStatus === 'verified' && (
                        <span className="ml-1 text-green-500 flex items-center">
                          <CheckCircle className="h-3 w-3" />
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {person.linkedinUrl && (
                  <a 
                    href={person.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Link className="h-3 w-3 mr-1" />
                    <span>LinkedIn</span>
                  </a>
                )}
                
                {person.seniority && (
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {person.seniority.replace(/_/g, ' ')}
                  </span>
                )}
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
    <div className="bg-white border rounded-lg p-4 mb-4">
      <h3 className="font-bold text-lg mb-3 text-gray-800">Opportunity Signals</h3>
      
      {insights.buyingSignals && insights.buyingSignals.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center">
            <Zap className="h-4 w-4 mr-1 text-yellow-500" />
            Buying Signals
          </h4>
          <ul className="space-y-2">
            {insights.buyingSignals.map((signal, idx) => (
              <li key={idx} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {insights.growthIndicators && insights.growthIndicators.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />
            Growth Indicators
          </h4>
          <ul className="space-y-2">
            {insights.growthIndicators.map((indicator, idx) => (
              <li key={idx} className="flex items-start">
                <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CompanyProfile = ({ data, pdlData }) => {
  if (pdlData?.companyData) {
    const companyData = pdlData.companyData;
    
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-xl text-gray-900">
                {companyData.display_name || companyData.name || pdlData.company || "Unknown"}
              </h3>
              <p className="text-md text-gray-600 mt-1">{companyData.industry || "Industry not available"}</p>
            </div>
            <div className="flex space-x-2">
              {companyData.linkedin_url && (
                <a 
                  href={`https://${companyData.linkedin_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 text-blue-600"
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
                  className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 text-blue-600"
                  title="Website"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="flex items-start">
              <Briefcase className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Company Size</p>
                <p className="font-medium">
                  {companyData.employee_count 
                    ? `${companyData.employee_count.toLocaleString()} employees` 
                    : companyData.size || 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Headquarters</p>
                <p className="font-medium">
                  {companyData.location 
                    ? [
                        companyData.location.locality, 
                        companyData.location.region, 
                        companyData.location.country
                      ].filter(Boolean).join(', ') 
                    : 'Unknown'}
                </p>
              </div>
            </div>
            
            {companyData.type && (
              <div className="flex items-start">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Company Type</p>
                  <p className="font-medium capitalize">{companyData.type}</p>
                </div>
              </div>
            )}
            
            {companyData.founded && (
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Founded</p>
                  <p className="font-medium">{companyData.founded}</p>
                </div>
              </div>
            )}
          </div>
          
          {companyData.summary && (
            <div className="mt-5 border-t pt-4">
              <p className="text-xs text-gray-500 mb-1">Company Description</p>
              <p className="text-sm text-gray-700">{companyData.summary}</p>
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
      <div className="bg-white border rounded-lg p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-xl text-gray-900">{companyInfo.name}</h3>
            <p className="text-md text-gray-600 mt-1">{companyInfo.industry}</p>
          </div>
          <div className="flex space-x-2">
            {companyInfo.socialProfiles?.linkedin && (
              <a 
                href={companyInfo.socialProfiles.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 text-blue-600"
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
                className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 text-blue-600"
                title="Website"
              >
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="flex items-start">
            <Briefcase className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Company Size</p>
              <p className="font-medium">{companyInfo.size?.toLocaleString() || 'Unknown'} employees</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Annual Revenue</p>
              <p className="font-medium">{companyInfo.revenue || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Headquarters</p>
              <p className="font-medium">
                {[companyInfo.location?.city, companyInfo.location?.state, companyInfo.location?.country]
                  .filter(Boolean).join(', ') || 'Unknown'}
              </p>
            </div>
          </div>
          
          {funding.totalRaised && funding.totalRaised !== 'Unknown' && (
            <div className="flex items-start">
              <Award className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Total Funding</p>
                <p className="font-medium">{funding.totalRaised}</p>
              </div>
            </div>
          )}
        </div>
        
        {companyInfo.description && (
          <div className="mt-5 border-t pt-4">
            <p className="text-xs text-gray-500 mb-1">Company Description</p>
            <p className="text-sm text-gray-700">{companyInfo.description}</p>
          </div>
        )}
        
        {funding.lastFunding && (
          <div className="mt-4 bg-green-50 p-3 rounded-lg flex items-start">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Recent {funding.lastFunding.type} Funding</p>
              <p className="text-sm text-green-700">
                {funding.lastFunding.amount} ({new Date(funding.lastFunding.date).toLocaleDateString()})
              </p>
            </div>
          </div>
        )}
      </div>
      
      <BuyingSignalsCard insights={insights} />
      
      <div className="bg-white border rounded-lg p-5">
        <TechnologyStackDisplay technologies={technologies} />
      </div>
      
      <div className="bg-white border rounded-lg p-5">
        <KeyPeopleList people={keyPeople} />
      </div>
    </div>
  );
};

const CompanyTab = ({ apolloData, pdlData, displayName }) => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Profile</h2>
      
      {apolloData || pdlData ? (
        <CompanyProfile data={apolloData} pdlData={pdlData} />
      ) : (
        <NoCompanyDisplay companyName={displayName} />
      )}
    </div>
  );
};

export default CompanyTab;