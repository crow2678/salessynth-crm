// common/CommonComponents.jsx
import React from 'react';
import { AlertCircle, Brain, Building, ExternalLink } from 'lucide-react';

export const LoadingSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="animate-pulse">
      <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
        <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const ErrorDisplay = ({ message }) => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <div className="text-red-500 font-medium">{message}</div>
    </div>
  </div>
);

export const NoReportDisplay = ({ companyName }) => (
  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
    <Brain className="w-16 h-16 text-blue-200 mb-6" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      Generating Intelligence Report
    </h3>
    <p className="text-gray-600 max-w-md mb-4">
      We're currently analyzing data for <span className="font-semibold">{companyName || 'this company'}</span>. 
      This process typically takes a few minutes to ensure comprehensive insights.
    </p>
    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
      <div className="animate-pulse flex space-x-1">
        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
      </div>
      <span className="ml-2">Report generation in progress</span>
    </div>
  </div>
);

export const NoCompanyDisplay = ({ companyName }) => (
  <div className="bg-white rounded-lg shadow-sm p-10 text-center">
    <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-700">{companyName}</h3>
    <p className="text-gray-500 mt-3 max-w-md mx-auto">
      We're currently gathering company information. Check back soon for detailed company insights.
    </p>
  </div>
);

export const GoogleNewsCard = ({ item, compact = false }) => (
  <div className={`bg-white border rounded-lg ${compact ? 'p-3 mb-2' : 'p-4 mb-3'} hover:shadow-md transition-shadow`}>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-2">
      <div className="flex-1">
        <h3 className={`font-medium text-blue-600 hover:underline ${compact ? 'text-sm' : ''}`}>{item.title}</h3>
        {!compact && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.snippet}</p>
        )}
        <div className={`flex items-center ${compact ? 'mt-1 text-xs' : 'mt-2 text-xs'} text-gray-500`}>
          <span className="font-medium">{item.source}</span>
          <span className="mx-2">•</span>
          <span>{item.publishedDate}</span>
        </div>
      </div>
      <ExternalLink className="text-gray-400 w-4 h-4 flex-shrink-0 mt-1" />
    </a>
  </div>
);

export const ProfessionalExperienceCard = ({ experience }) => {
  if (!experience) return null;
  
  return (
    <div className="border rounded-lg p-3 mb-3 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{experience.title?.name || "Role"}</h3>
          <p className="text-sm text-gray-700">{experience.company?.name || "Company"}</p>
        </div>
        <div className="text-xs text-gray-500">
          {experience.start_date && (
            <span>
              {experience.start_date} - {experience.end_date || "Present"}
            </span>
          )}
        </div>
      </div>
      {experience.summary && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{experience.summary}</p>
      )}
      {experience.location_names && experience.location_names.length > 0 && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <Building className="w-3 h-3 mr-1" />
          <span>{experience.location_names[0]}</span>
        </div>
      )}
    </div>
  );
};