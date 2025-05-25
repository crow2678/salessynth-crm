// tabs/ProfileTab.jsx
import React, { useState } from 'react';
import { 
  Users, 
  Building, 
  Calendar, 
  Link, 
  Globe, 
  ExternalLink,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Shield,
  TrendingUp
} from 'lucide-react';
import { NoCompanyDisplay, ProfessionalExperienceCard } from '../common/CommonComponents';

// Utility function to convert text to title case
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Utility function to format dates
const formatDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr || '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  } catch {
    return dateStr;
  }
};

// Utility function to calculate experience duration
const calculateDuration = (startDate, endDate) => {
  if (!startDate || typeof startDate !== 'string') return '';
  
  try {
    const start = new Date(startDate);
    const end = endDate && typeof endDate === 'string' ? new Date(endDate) : new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    if (months < 1) return '1 month';
    if (months < 12) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
      } else {
        return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
      }
    }
  } catch {
    return '';
  }
};

// Enhanced Professional Experience Card
const EnhancedExperienceCard = ({ experience }) => {
  // Safety function to extract string from object or return string
  const safeString = (value, fallback = 'Unknown') => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return value.name || value.title || value.display_name || String(value);
    }
    return fallback;
  };

  // Safety function to extract location names
  const safeLocationNames = (locationNames) => {
    if (!locationNames) return [];
    if (Array.isArray(locationNames)) {
      return locationNames
        .map(loc => safeString(loc))
        .filter(loc => loc && loc !== 'Unknown');
    }
    return [safeString(locationNames)].filter(loc => loc && loc !== 'Unknown');
  };

  const duration = calculateDuration(experience.start_date, experience.end_date);
  const isCurrent = !experience.end_date;
  const title = safeString(experience.title, 'Unknown Position');
  const companyName = safeString(experience.company?.name || experience.company, 'Unknown Company');
  const locations = safeLocationNames(experience.location_names);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-gray-900">
            {toTitleCase(title)}
          </h4>
          <div className="flex items-center mt-1">
            <Building className="h-4 w-4 text-blue-500 mr-2" />
            <p className="text-blue-600 font-medium">
              {toTitleCase(companyName)}
            </p>
          </div>
        </div>
        {isCurrent && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Current
          </span>
        )}
      </div>
      
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <Calendar className="h-4 w-4 mr-2" />
        <span>
          {formatDate(experience.start_date)} - {experience.end_date ? formatDate(experience.end_date) : 'Present'}
        </span>
        {duration && (
          <>
            <span className="mx-2">•</span>
            <Clock className="h-4 w-4 mr-1" />
            <span>{duration}</span>
          </>
        )}
      </div>
      
      {locations.length > 0 && (
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{locations.map(loc => toTitleCase(loc)).join(', ')}</span>
        </div>
      )}
      
      {experience.summary && typeof experience.summary === 'string' && (
        <p className="text-sm text-gray-700 leading-relaxed mt-3 p-3 bg-gray-50 rounded-lg">
          {experience.summary}
        </p>
      )}
    </div>
  );
};

// Enhanced Education Card
const EnhancedEducationCard = ({ education }) => {
  // Helper function to safely join arrays of strings
  const safeJoinArray = (arr) => {
    if (!Array.isArray(arr)) return '';
    return arr
      .filter(item => item && typeof item === 'string')
      .map(item => toTitleCase(item))
      .join(', ');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-lg text-gray-900">
              {toTitleCase(education.school?.name) || 'Unknown Institution'}
            </h4>
            
            {education.degrees && Array.isArray(education.degrees) && education.degrees.length > 0 && (
              <div className="mt-1">
                <p className="text-blue-600 font-medium">
                  {safeJoinArray(education.degrees)}
                </p>
              </div>
            )}
            
            {education.majors && Array.isArray(education.majors) && education.majors.length > 0 && (
              <div className="mt-1">
                <p className="text-gray-600">
                  Major: {safeJoinArray(education.majors)}
                </p>
              </div>
            )}
            
            {(education.start_date || education.end_date) && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {formatDate(education.start_date)} - {formatDate(education.end_date)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to extract skill name from skill object or string
const getSkillName = (skill) => {
  if (typeof skill === 'string') return skill;
  if (typeof skill === 'object' && skill !== null) {
    return skill.name || skill.skill || skill.title || String(skill);
  }
  return String(skill);
};

// Skills Section with categories
const SkillsSection = ({ skills }) => {
  if (!skills || !Array.isArray(skills) || skills.length === 0) return null;
  
  // Convert all skills to strings and filter out invalid ones
  const validSkills = skills
    .map(skill => getSkillName(skill))
    .filter(skillName => skillName && typeof skillName === 'string' && skillName.trim().length > 0);
  
  if (validSkills.length === 0) return null;
  
  // Group skills by type/category (basic categorization)
  const technicalSkills = validSkills.filter(skill => 
    skill.toLowerCase().includes('software') || 
    skill.toLowerCase().includes('technology') ||
    skill.toLowerCase().includes('programming') ||
    skill.toLowerCase().includes('data') ||
    skill.toLowerCase().includes('analytics')
  );
  
  const businessSkills = validSkills.filter(skill => 
    skill.toLowerCase().includes('management') ||
    skill.toLowerCase().includes('leadership') ||
    skill.toLowerCase().includes('strategy') ||
    skill.toLowerCase().includes('business') ||
    skill.toLowerCase().includes('sales') ||
    skill.toLowerCase().includes('marketing')
  );
  
  const otherSkills = validSkills.filter(skill => 
    !technicalSkills.includes(skill) && 
    !businessSkills.includes(skill)
  );
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <Star className="h-5 w-5 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Skills & Expertise</h3>
        <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {validSkills.length} Skills
        </span>
      </div>
      
      <div className="space-y-4">
        {businessSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Business & Leadership
            </h4>
            <div className="flex flex-wrap gap-2">
              {businessSkills.map((skill, idx) => (
                <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {toTitleCase(skill)}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {technicalSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Technical
            </h4>
            <div className="flex flex-wrap gap-2">
              {technicalSkills.map((skill, idx) => (
                <span key={idx} className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {toTitleCase(skill)}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {otherSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              Other Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {otherSkills.map((skill, idx) => (
                <span key={idx} className="bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {toTitleCase(skill)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileView = ({ pdlData }) => {
  const [showAllExperience, setShowAllExperience] = useState(false);
  
  if (!pdlData || !pdlData.personData || !pdlData.personData.data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Profile Data Available</h3>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          We don't have detailed profile information for this contact yet. Profile data will appear here when available.
        </p>
      </div>
    );
  }

  const personData = pdlData.personData.data;
  
  // Safety function to extract string values
  const safeString = (value, fallback = '') => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return value.name || value.title || value.display_name || String(value);
    }
    return fallback;
  };

  const firstName = safeString(personData.first_name);
  const lastName = safeString(personData.last_name);
  const fullName = safeString(personData.full_name) || `${firstName} ${lastName}`.trim();
  const jobTitle = safeString(personData.job_title);
  const jobCompanyName = safeString(personData.job_company_name);
  const industry = safeString(personData.industry);
  const jobCompanySize = safeString(personData.job_company_size);
  const jobCompanyLocation = safeString(personData.job_company_location_name);
  
  const initials = firstName && lastName ? 
    `${firstName[0]}${lastName[0]}`.toUpperCase() : 
    fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || "??";
  
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center mr-6 text-xl font-bold shadow-lg">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-2xl text-gray-900 mb-1">
                {toTitleCase(fullName) || 'Unknown Contact'}
              </h3>
              <p className="text-lg text-blue-600 font-semibold">
                {toTitleCase(jobTitle) || 'No Title Available'}
              </p>
              {jobCompanyName && (
                <p className="text-gray-600 flex items-center mt-1">
                  <Building className="h-4 w-4 mr-1" />
                  at {toTitleCase(jobCompanyName)}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {personData.linkedin_url && typeof personData.linkedin_url === 'string' && (
              <a 
                href={`https://${personData.linkedin_url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition-colors duration-150"
                title="LinkedIn Profile"
              >
                <Link className="h-5 w-5" />
              </a>
            )}
            {personData.emails && Array.isArray(personData.emails) && personData.emails.length > 0 && (
              <div className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-colors duration-150" title="Email Available">
                <Mail className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>

        {/* Professional Details Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Briefcase className="h-5 w-5 text-gray-500 mr-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Industry</p>
            </div>
            <p className="font-semibold text-gray-900">{toTitleCase(industry) || 'Unknown'}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Start Date</p>
            </div>
            <p className="font-semibold text-gray-900">{formatDate(personData.job_start_date) || 'Unknown'}</p>
          </div>
          
          {jobCompanySize && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-gray-500 mr-2" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Size</p>
              </div>
              <p className="font-semibold text-gray-900">{toTitleCase(jobCompanySize)}</p>
            </div>
          )}
          
          {jobCompanyLocation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
              </div>
              <p className="font-semibold text-gray-900">{toTitleCase(jobCompanyLocation)}</p>
            </div>
          )}
        </div>

        {/* Contact Information */}
        {(personData.emails || personData.phone_numbers) && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {personData.emails && Array.isArray(personData.emails) && personData.emails.length > 0 && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">{safeString(personData.emails[0].address)}</span>
                  {personData.emails[0].type && (
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {toTitleCase(safeString(personData.emails[0].type))}
                    </span>
                  )}
                </div>
              )}
              {personData.phone_numbers && Array.isArray(personData.phone_numbers) && personData.phone_numbers.length > 0 && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">{safeString(personData.phone_numbers[0].number)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Skills Section */}
      <SkillsSection skills={personData.skills} />

      {/* Professional Experience */}
      {personData.experience && Array.isArray(personData.experience) && personData.experience.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Professional Experience</h3>
            </div>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {personData.experience.length} {personData.experience.length === 1 ? 'Position' : 'Positions'}
            </span>
          </div>
          
          <div className="space-y-4">
            {(showAllExperience ? personData.experience : personData.experience.slice(0, 3))
              .map((exp, idx) => (
                <EnhancedExperienceCard key={idx} experience={exp} />
              ))}
            
            {personData.experience.length > 3 && (
              <div className="text-center pt-4">
                <button 
                  onClick={() => setShowAllExperience(!showAllExperience)}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-150"
                >
                  {showAllExperience ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show {personData.experience.length - 3} More Positions
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Education */}
      {personData.education && Array.isArray(personData.education) && personData.education.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <GraduationCap className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Education</h3>
            </div>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {personData.education.length} {personData.education.length === 1 ? 'Degree' : 'Degrees'}
            </span>
          </div>
          
          <div className="space-y-4">
            {personData.education.map((edu, idx) => (
              <EnhancedEducationCard key={idx} education={edu} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileTab = ({ pdlData }) => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Profile</h2>
        <p className="text-gray-600">Comprehensive professional background and contact information</p>
      </div>
      <ProfileView pdlData={pdlData} />
    </div>
  );
};

export default ProfileTab;