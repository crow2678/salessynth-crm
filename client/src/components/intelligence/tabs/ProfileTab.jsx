// tabs/ProfileTab.jsx
import React from 'react';
import { 
  Users, 
  Building, 
  Calendar, 
  Link, 
  Globe, 
  ExternalLink 
} from 'lucide-react';
import { NoCompanyDisplay, ProfessionalExperienceCard } from '../common/CommonComponents';

const ProfileView = ({ pdlData }) => {
  if (!pdlData || !pdlData.personData || !pdlData.personData.data) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-10 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">No Profile Data Available</h3>
        <p className="text-gray-500 mt-3 max-w-md mx-auto">
          We don't have detailed profile information for this contact yet.
        </p>
      </div>
    );
  }

  const personData = pdlData.personData.data;
  
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-4">
              {personData.first_name && personData.last_name ? 
                `${personData.first_name[0]}${personData.last_name[0]}` : "??"
              }
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">
                {personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`}
              </h3>
              <p className="text-md text-blue-600 mt-1">{personData.job_title || 'No Title'}</p>
              <p className="text-sm text-gray-600">
                {personData.job_company_name ? `at ${personData.job_company_name}` : ''}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {personData.linkedin_url && (
              <a 
                href={`https://${personData.linkedin_url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 text-blue-600"
                title="LinkedIn"
              >
                <Link className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="flex items-start">
            <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Industry</p>
              <p className="font-medium capitalize">{personData.industry || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Job Start Date</p>
              <p className="font-medium">{personData.job_start_date || 'Unknown'}</p>
            </div>
          </div>
          
          {personData.job_company_size && (
            <div className="flex items-start">
              <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Company Size</p>
                <p className="font-medium">{personData.job_company_size}</p>
              </div>
            </div>
          )}
          
          {personData.job_company_location_name && (
            <div className="flex items-start">
              <Globe className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium">{personData.job_company_location_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {personData.skills && personData.skills.length > 0 && (
        <div className="bg-white border rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {personData.skills.map((skill, idx) => (
              <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {personData.experience && personData.experience.length > 0 && (
        <div className="bg-white border rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Professional Experience</h3>
          <div className="space-y-4">
            {personData.experience.slice(0, 4).map((exp, idx) => (
              <ProfessionalExperienceCard key={idx} experience={exp} />
            ))}
            {personData.experience.length > 4 && (
              <div className="text-center">
                <button className="text-blue-600 text-sm hover:underline">
                  Show {personData.experience.length - 4} more...
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {personData.education && personData.education.length > 0 && (
        <div className="bg-white border rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Education</h3>
          <div className="space-y-3">
            {personData.education.map((edu, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <h4 className="font-medium text-gray-900">{edu.school?.name || 'Unknown Institution'}</h4>
                <div className="text-sm text-gray-600 flex flex-wrap items-center gap-1 mt-1">
                  {edu.degrees && edu.degrees.length > 0 && (
                    <span className="capitalize">
                      {edu.degrees.join(', ')}
                    </span>
                  )}
                  {edu.majors && edu.majors.length > 0 && (
                    <span>
                      {edu.degrees && edu.degrees.length > 0 ? ' in ' : ''}
                      {edu.majors.join(', ')}
                    </span>
                  )}
                </div>
                {(edu.start_date || edu.end_date) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {edu.start_date || ''}{edu.start_date && edu.end_date ? ' - ' : ''}{edu.end_date || ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileTab = ({ pdlData }) => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Profile</h2>
      <ProfileView pdlData={pdlData} />
    </div>
  );
};

export default ProfileTab;