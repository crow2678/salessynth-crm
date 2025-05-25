import React, { useState } from 'react';
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
  Hash,
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';

const ExpandableSection = ({ title, children, defaultExpanded = false, icon: Icon }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-5 w-5 text-gray-600" />}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
};

const CompanyStats = ({ pdlData }) => {
  if (!pdlData?.companyData) return null;

  const companyData = pdlData.companyData;
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm text-gray-600">Employees</p>
            <p className="text-lg font-bold text-blue-900">
              {companyData.employee_count?.toLocaleString() || 'Unknown'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Building className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="text-lg font-bold text-green-900 capitalize">
              {companyData.type?.replace('_', ' ') || 'Unknown'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-sm text-gray-600">Headquarters</p>
            <p className="text-lg font-bold text-purple-900">
              {companyData.location?.locality || 'Unknown'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Hash className="h-5 w-5 text-orange-600" />
          <div>
            <p className="text-sm text-gray-600">Industry</p>
            <p className="text-lg font-bold text-orange-900">
              {companyData.industry || 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompanyOverview = ({ pdlData }) => {
  if (!pdlData?.companyData) return null;

  const companyData = pdlData.companyData;
  
  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {companyData.display_name || companyData.name}
          </h2>
          <p className="text-gray-600 text-lg">{companyData.industry}</p>
          {companyData.headline && (
            <p className="text-blue-600 font-medium mt-1">{companyData.headline}</p>
          )}
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
              href={`https://${companyData.website}`} 
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
      
      {companyData.summary && (
        <div className="mt-4">
          <p className="text-gray-700 leading-relaxed">{companyData.summary}</p>
        </div>
      )}
    </div>
  );
};

const AlternativeNames = ({ pdlData }) => {
  if (!pdlData?.companyData?.alternative_names?.length) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Also Known As</h4>
      <div className="flex flex-wrap gap-2">
        {pdlData.companyData.alternative_names.slice(0, 8).map((name, idx) => (
          <span 
            key={idx} 
            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
          >
            {name}
          </span>
        ))}
        {pdlData.companyData.alternative_names.length > 8 && (
          <span className="text-xs text-gray-500">
            +{pdlData.companyData.alternative_names.length - 8} more
          </span>
        )}
      </div>
    </div>
  );
};

const IndustryCodes = ({ pdlData }) => {
  if (!pdlData?.companyData) return null;

  const { naics, sic } = pdlData.companyData;
  
  if ((!naics || naics.length === 0) && (!sic || sic.length === 0)) return null;

  return (
    <div className="space-y-4">
      {naics && naics.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">NAICS Codes</h4>
          <div className="space-y-2">
            {naics.slice(0, 3).map((code, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {code.naics_code}
                    </span>
                    <p className="text-sm text-gray-900 font-medium">
                      {code.national_industry}
                    </p>
                    <p className="text-xs text-gray-600">{code.sector}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {sic && sic.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">SIC Codes</h4>
          <div className="space-y-2">
            {sic.slice(0, 3).map((code, idx) => (
              <div key={idx} className="border rounded p-3">
                <span className="font-mono text-sm font-medium text-green-600">
                  {code.sic_code}
                </span>
                <p className="text-sm text-gray-900 font-medium">
                  {code.major_group}
                </p>
                {code.industry_sector && (
                  <p className="text-xs text-gray-600">{code.industry_sector}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const EmployeeDistribution = ({ pdlData }) => {
  if (!pdlData?.companyData?.employee_count_by_country) return null;

  const countryData = pdlData.companyData.employee_count_by_country;
  
  // Sort countries by employee count and take top 10
  const topCountries = Object.entries(countryData)
    .filter(([country, count]) => country !== 'other_uncategorized' && count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const totalEmployees = Object.values(countryData).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Top Employee Locations</h4>
        <span className="text-xs text-gray-500">
          Total: {totalEmployees.toLocaleString()} employees
        </span>
      </div>
      <div className="space-y-2">
        {topCountries.map(([country, count]) => {
          const percentage = ((count / totalEmployees) * 100).toFixed(1);
          return (
            <div key={country} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {country.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EnhancedCompanyTab = ({ apolloData, pdlData, displayName }) => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Company Intelligence</h1>
      
      {pdlData?.companyData ? (
        <div className="space-y-6">
          <CompanyOverview pdlData={pdlData} />
          <CompanyStats pdlData={pdlData} />
          
          <div className="space-y-4">
            <ExpandableSection 
              title="Alternative Names & Identifiers" 
              icon={Hash}
              defaultExpanded={false}
            >
              <AlternativeNames pdlData={pdlData} />
            </ExpandableSection>

            <ExpandableSection 
              title="Industry Classification" 
              icon={Layers}
              defaultExpanded={false}
            >
              <IndustryCodes pdlData={pdlData} />
            </ExpandableSection>

            <ExpandableSection 
              title="Global Employee Distribution" 
              icon={MapPin}
              defaultExpanded={true}
            >
              <EmployeeDistribution pdlData={pdlData} />
            </ExpandableSection>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Company Data Available
          </h3>
          <p className="text-gray-500">
            Company information for {displayName} is not currently available.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedCompanyTab;