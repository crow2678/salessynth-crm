// src/components/intelligence/IntelligenceModal.jsx - PART 1
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  MessageCircle, 
  ChevronRight,
  X, 
  ExternalLink,
  AlertCircle,
  Building,
  Users,
  TrendingUp,
  Calendar,
  Globe,
  FileText,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  CheckCircle,
  Zap,
  AlertTriangle,
  Database,
  Server,
  Share2,
  Award,
  Link,
  Hash,
  Rocket,
  Clock,
  Check,
  Info,
  Shield,
  BarChart,
  GitBranch
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

// Loading Skeleton Component
const LoadingSkeleton = () => (
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

// Error Display Component
const ErrorDisplay = ({ message }) => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <div className="text-red-500 font-medium">{message}</div>
    </div>
  </div>
);

// No Report Display Component
const NoReportDisplay = ({ companyName }) => (
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

// Google News Card Component
const GoogleNewsCard = ({ item, compact = false }) => (
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

// Reddit Post Card Component
const RedditPostCard = ({ post, compact = false }) => (
  <div className={`bg-white border rounded-lg ${compact ? 'p-3 mb-2' : 'p-4 mb-3'} hover:shadow-md transition-shadow`}>
    <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
      <h3 className={`font-medium text-blue-600 hover:underline ${compact ? 'text-sm' : ''}`}>{post.title}</h3>
      <div className={`flex items-center ${compact ? 'mt-1 text-xs' : 'mt-2 text-xs'} text-gray-500`}>
        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
          r/{post.subreddit}
        </span>
        <span className="mx-2">•</span>
        <span>{post.upvotes} upvotes</span>
        {!compact && (
          <>
            <span className="mx-2">•</span>
            <span>{post.comments} comments</span>
          </>
        )}
      </div>
    </a>
  </div>
);

// Enhanced Technology Stack Component
const TechnologyStackDisplay = ({ technologies = [] }) => {
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

// Enhanced Key People Component
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

// Deal Intelligence Components
const DealScoreIndicator = ({ score = 50 }) => {
  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-blue-500";
    if (score >= 30) return "text-yellow-500";
    return "text-orange-500";
  };

  // Get label based on score
  const getScoreLabel = (score) => {
    if (score >= 80) return "Highly Likely";
    if (score >= 70) return "Promising";
    if (score >= 50) return "Moderately Positive";
    if (score >= 30) return "Uncertain";
    return "Challenging";
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const strokeColor = score >= 70 ? "#10b981" : score >= 50 ? "#3b82f6" : score >= 30 ? "#f59e0b" : "#f97316";

  return (
    <div className="flex items-center">
      <div className="relative w-28 h-28 mr-6 flex-shrink-0">
        {/* Circular progress */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="#e5e7eb" 
            strokeWidth="10"
          />
          <circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={`${score * 2.83} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text 
            x="50" y="50" 
            dominantBaseline="middle" 
            textAnchor="middle"
            className="text-2xl font-bold"
            fill="#1f2937"
          >
            {score}%
          </text>
        </svg>
      </div>
      
      <div>
        <div className="mb-2">
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {scoreLabel}
          </span>
        </div>
        <p className="text-gray-700 text-sm">Multiple detailed follow-up questions and technical inquiries indicate serious interest. The client is exploring integration capabilities in-depth.</p>
      </div>
    </div>
  );
};

// Buying Signals & Growth Indicators Components
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
// src/components/intelligence/IntelligenceModal.jsx - PART 2

// Deal Stage Timeline Component
const DealStageTimeline = () => {
  // Placeholder data for deal stages
  const stageData = {
    currentStage: "Technical Evaluation",
    timeInStage: "7+ days",
    averageTimeToNext: "12-15 days",
    nextStage: "Vendor Selection",
    completedStages: ["Initial Contact", "Discovery", "Demo"],
    upcomingStages: ["Vendor Selection", "Contract Negotiation"],
    nextStageLikelihood: 65
  };

  return (
    <div className="border-l pl-6">
      <h4 className="font-medium text-gray-800 mb-2">Deal Stage Analysis</h4>
      <div className="relative">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-4 relative">
          {stageData.completedStages.map((stage, index) => (
            <div key={index} className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 z-10 mr-3"></div>
              <span className="text-gray-600 text-sm">{stage}</span>
              <Check size={14} className="text-green-500 ml-2" />
            </div>
          ))}
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 z-10 mr-3"></div>
            <span className="text-gray-800 font-medium text-sm">{stageData.currentStage}</span>
            <Clock size={14} className="text-blue-500 ml-2" />
            <span className="text-xs text-gray-500 ml-2">{stageData.timeInStage}</span>
          </div>
          {stageData.upcomingStages.map((stage, index) => (
            <div key={index} className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gray-300 z-10 mr-3"></div>
              <span className="text-gray-500 text-sm">{stage}</span>
              {index === 0 && (
                <span className="text-xs text-blue-600 ml-2">{stageData.nextStageLikelihood}% likelihood</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Deal Factors Component
const DealFactorsAnalysis = () => {
  // Placeholder data for deal factors
  const factorsData = {
    positive: [
      { description: "Multiple detailed technical questions", impact: 4 },
      { description: "Demo request for specific teams", impact: 5 },
      { description: "Integration inquiries with existing systems", impact: 3 },
      { description: "Budget discussion initiated", impact: 4 }
    ],
    negative: [
      { description: "Competing solution evaluation in progress", impact: -3 },
      { description: "No clear decision timeline established", impact: -2 },
      { description: "Technical integration concerns raised", impact: -2 }
    ]
  };

  return (
    <div className="p-6 border-b">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Success Factors</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-medium text-green-600 flex items-center">
            <Check size={16} className="mr-1" />
            Positive Signals
          </h4>
          {factorsData.positive.map((factor, i) => (
            <div key={i} className="flex items-center">
              <div className="w-1 h-6 bg-green-500 rounded-sm mr-2"></div>
              <span className="text-gray-700 text-sm">{factor.description}</span>
              <div className="ml-auto flex">
                {[...Array(Math.abs(factor.impact))].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 mx-0.5 rounded-full bg-green-500" />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-orange-600 flex items-center">
            <AlertCircle size={16} className="mr-1" />
            Potential Concerns
          </h4>
          {factorsData.negative.map((factor, i) => (
            <div key={i} className="flex items-center">
              <div className="w-1 h-6 bg-orange-500 rounded-sm mr-2"></div>
              <span className="text-gray-700 text-sm">{factor.description}</span>
              <div className="ml-auto flex">
                {[...Array(Math.abs(factor.impact))].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 mx-0.5 rounded-full bg-orange-500" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Critical Requirements & Next Stage Analysis
const CriticalRequirementsAndNextStage = () => {
  // Placeholder data
  const requirements = [
    { title: "Integration Capabilities", description: "API connection to existing systems" },
    { title: "Compliance Features", description: "Support for regulatory requirements" },
    { title: "User Management", description: "Role-based access control and workflow" }
  ];

  const nextStageData = {
    timeframe: "3-4 weeks",
    value: "$350,000",
    blockers: [
      "Technical validation with IT team",
      "Competitive evaluation completion",
      "Budget approval process"
    ]
  };

  return (
    <div className="p-6 border-b grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Info size={18} className="mr-2 text-blue-500" />
          Critical Client Requirements
        </h3>
        <div className="space-y-2">
          {requirements.map((req, idx) => (
            <div key={idx} className="rounded-md border border-blue-100 bg-blue-50 p-3">
              <h4 className="font-medium text-blue-800">{req.title}</h4>
              <p className="text-sm text-blue-700 mt-1">{req.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp size={18} className="mr-2 text-green-500" />
          Next Stage Analysis
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Timeframe:</span>
            <span className="font-medium">{nextStageData.timeframe}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Potential Value:</span>
            <span className="font-medium text-green-700">{nextStageData.value}</span>
          </div>
          <div>
            <div className="text-gray-700 mb-2">Key Blockers:</div>
            <ul className="space-y-1">
              {nextStageData.blockers.map((blocker, i) => (
                <li key={i} className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 mr-2"></span>
                  <span className="text-sm text-gray-700">{blocker}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Strategic Recommendations Component
const StrategicRecommendations = () => {
  // Placeholder recommendations
  const recommendations = [
    "Focus on integration capabilities with their existing systems",
    "Prepare detailed compliance documentation for security review",
    "Schedule technical deep dive with IT stakeholders",
    "Provide case studies from similar industry implementations"
  ];

  return (
    <div className="p-6 bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Shield size={18} className="mr-2 text-green-600" />
        Strategic Recommendations
      </h3>
      <div className="space-y-3">
        {recommendations.map((step, i) => (
          <div key={i} className="flex items-start">
            <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              {i + 1}
            </div>
            <span className="text-gray-700">{step}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <GitBranch size={16} className="mr-2" />
            Response Planning
          </h4>
          <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Generate Response Plan
          </button>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Quick Actions</h4>
          <div className="flex space-x-3">
            <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center">
              <Calendar size={14} className="mr-2" />
              Schedule Meeting
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center">
              Update Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Market Intelligence Component
const MarketIntelligence = () => {
  // Placeholder market intelligence data
  const marketData = [
    {
      title: "Company Expands Technology Division with New Hires",
      source: "Business Wire",
      date: "Mar 5, 2025",
      snippet: "Client is expanding internal technology team, representing both an opportunity and potential competition."
    },
    {
      title: "Industry Regulatory Changes Expected in Q2",
      source: "Financial Times",
      date: "Feb 22, 2025",
      snippet: "New compliance requirements may drive increased demand for advanced analytics solutions."
    }
  ];

  return (
    <div className="p-6 border-b">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <BarChart size={18} className="mr-2 text-indigo-500" />
        Market Intelligence
      </h3>
      <div className="space-y-4">
        {marketData.map((item, idx) => (
          <div key={idx} className="border rounded-md p-3 hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-indigo-700 flex items-center">
              {item.title}
              <ExternalLink size={14} className="ml-2 text-gray-400" />
            </h4>
            <p className="text-sm text-gray-500 mt-1">{item.source} • {item.date}</p>
            <p className="text-sm text-gray-700 mt-2">{item.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Company Profile Component
const CompanyProfile = ({ data }) => {
  if (!data) return null;
  
  const companyInfo = data.company || {};
  const keyPeople = data.keyPeople || [];
  const technologies = data.technologies || {};
  const insights = data.insights || {};
  const funding = data.funding || {};
  
  return (
    <div className="space-y-6">
      {/* Company Overview */}
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
        
        {/* Latest Funding */}
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
      
      {/* Buying Signals & Growth Card */}
      <BuyingSignalsCard insights={insights} />
      
      {/* Technology Stack */}
      <div className="bg-white border rounded-lg p-5">
        <TechnologyStackDisplay technologies={technologies} />
      </div>
      
      {/* Key People */}
      <div className="bg-white border rounded-lg p-5">
        <KeyPeopleList people={keyPeople} />
      </div>
    </div>
  );
};
// src/components/intelligence/IntelligenceModal.jsx - PART 3

// Enhanced Dashboard Company Card
const CompanyDashboardCard = ({ data }) => {
  if (!data) return null;
  
  const companyInfo = data.company || {};
  const insights = data.insights || {};
  const funding = data.funding || {};
  
  // Extract the most important signals
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
        
        {companyInfo.socialProfiles?.linkedin && (
          <a 
            href={companyInfo.socialProfiles.linkedin} 
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
          <p className="font-medium">{companyInfo.size ? `~${companyInfo.size} employees` : 'Unknown'}</p>
        </div>
        <div>
          <p className="text-gray-500">Revenue</p>
          <p className="font-medium">{companyInfo.revenue || 'Unknown'}</p>
        </div>
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

// Key People Dashboard Card
const KeyPeopleDashboardCard = ({ people = [] }) => {
  if (!people || people.length === 0) return null;
  
  // Show only top 3 people for dashboard
  const topPeople = people.slice(0, 3);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mt-4">
      <h3 className="font-bold text-lg text-gray-900 mb-4">Key Decision Makers</h3>
      
      <div className="space-y-3">
        {topPeople.map((person, idx) => (
          <div key={idx} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                href={person.linkedinUrl} 
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
      
      {people.length > 3 && (
        <div className="mt-3 text-center">
          <button className="text-xs text-blue-600 hover:text-blue-800">
            View all {people.length} contacts
          </button>
        </div>
      )}
    </div>
  );
};

// Format the Markdown text properly
const formatMarkdown = (text) => {
  if (!text) return '';
  
  // Handle bold text
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Make section titles bold
  formattedText = formattedText.replace(/(###\s+[0-9️⃣]+\s+.*?)$/gm, '<h3 class="font-bold text-lg mb-3">$1</h3>');
  
  // Replace newlines with <br>
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
};

// Format the MongoDB timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Not available';
  
  // Check if it's a MongoDB $date object
  if (timestamp.$date) {
    return new Date(timestamp.$date).toLocaleDateString();
  }
  
  // Regular date string
  return new Date(timestamp).toLocaleDateString();
};

const IntelligenceModal = ({ isOpen, onClose, clientId, userId, clientName }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [researchData, setResearchData] = useState(null);
  const [googleData, setGoogleData] = useState(null);
  const [redditData, setRedditData] = useState(null);
  const [apolloData, setApolloData] = useState(null);
  const [pdlData, setPdlData] = useState(null); // Placeholder for PDL data
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!clientId || !userId || !isOpen) {
      return;
    }

    const fetchResearchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
        const data = response.data;
        
        if (!data) {
          setError("No research data available for this client.");
          setLoading(false);
          return;
        }
        
        // Extract data and update state
        setResearchData(data);
        setGoogleData(data.data?.google || []);
        setRedditData(data.data?.reddit || []);
        setApolloData(data.data?.apollo || null);
        
        // Set placeholder PDL data (in the future, this will be real data)
        setPdlData({
          dealScore: 73,
          dealStage: "Technical Evaluation",
          dealValue: "$350,000"
        });
        
        // Set last updated using the MongoDB timestamp format
        setLastUpdated(data.timestamp || null);

      } catch (err) {
        console.error("❌ Error fetching research data:", err.response?.data || err.message);
        setError(err.response?.status === 404 
          ? "No research data available for this client yet."
          : "Failed to load research data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResearchData();
  }, [clientId, userId, isOpen]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  // Use companyName from the research data instead of clientName
  const displayName = apolloData?.company?.name || researchData?.companyName || clientName || "Company";
  const isSummaryAvailable = researchData?.summary;
  const areGoogleResultsAvailable = googleData && Array.isArray(googleData) && googleData.length > 0;
  const areRedditResultsAvailable = redditData && Array.isArray(redditData) && redditData.length > 0;
  const isApolloDataAvailable = apolloData && Object.keys(apolloData).length > 0;
  const isPdlDataAvailable = pdlData !== null;

  // Generate dynamic title based on data availability
  let dynamicTitle = "Sales Intelligence";
  if (areGoogleResultsAvailable && areRedditResultsAvailable && isApolloDataAvailable) {
    dynamicTitle = "360° Intelligence Brief";
  } else if (isApolloDataAvailable) {
    dynamicTitle = "Company Intelligence Profile";
  } else if (areGoogleResultsAvailable) {
    dynamicTitle = "Market Intelligence Report";
  } else if (areRedditResultsAvailable) {
    dynamicTitle = "Social Intelligence Insights";
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">{dynamicTitle}: {displayName}</h2>
            <p className="text-sm text-blue-100 mt-1">
              Intelligence updated: {formatTimestamp(lastUpdated)}
            </p>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" onClick={onClose}>
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('dashboard')}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            <span>Dashboard</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'deal-intelligence' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('deal-intelligence')}
          >
            <Rocket className="w-5 h-5 mr-2" />
            <span>Deal Intelligence</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'ai' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('ai')}
          >
            <Brain className="w-5 h-5 mr-2" />
            <span>AI Analysis</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'company' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('company')}
          >
            <Building className="w-5 h-5 mr-2" />
            <span>Company Profile</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'web' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('web')}
          >
            <Globe className="w-5 h-5 mr-2" />
            <span>Web Research</span>
          </button>
          <button 
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'social' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('social')}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <span>Social Insights</span>
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Summary Column */}
                    <div className="col-span-2 space-y-4">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Key Sales Insights</h3>
                          <button 
                            onClick={() => handleTabClick('ai')}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            Full Analysis <ChevronRight size={16} />
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
                      
                      {/* Deal Intelligence Preview */}
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{pdlData.dealScore}%</div>
                                <div className="text-xs text-gray-500 mt-1">Success Probability</div>
                              </div>
                              <div className="h-12 w-px bg-gray-200"></div>
                              <div>
                                <div className="text-sm font-medium text-gray-800">{pdlData.dealStage}</div>
                                <div className="text-xs text-gray-500 mt-1">Current Stage</div>
                              </div>
                              <div className="h-12 w-px bg-gray-200"></div>
                              <div>
                                <div className="text-sm font-bold text-green-600">{pdlData.dealValue}</div>
                                <div className="text-xs text-gray-500 mt-1">Potential Value</div>
                              </div>
                            </div>
                            
                            <div>
                              <button
                                onClick={() => handleTabClick('deal-intelligence')}
                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center text-sm"
                              >
                                <Rocket className="w-4 h-4 mr-1" />
                                Deal Analysis
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Deal intelligence is being generated...</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Web Research Preview */}
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
                      
                      {/* Social Insights Preview */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Social Media Mentions</h3>
                          {areRedditResultsAvailable && (
                            <button 
                              onClick={() => handleTabClick('social')}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              View All <ChevronRight size={16} />
                            </button>
                          )}
                        </div>
                        
                        {areRedditResultsAvailable ? (
                          <div>
                            {redditData.slice(0, 2).map((post, index) => (
                              <RedditPostCard key={index} post={post} compact={true} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No social media mentions found</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Company Profile Column */}
                    <div className="space-y-4">
                      {isApolloDataAvailable ? (
                        <>
                          <CompanyDashboardCard data={apolloData} />
                          <KeyPeopleDashboardCard people={apolloData.keyPeople} />
                        </>
                      ) : (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center py-8">
                          <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="font-semibold text-gray-700">{displayName}</h3>
                          <p className="text-gray-500 mt-2">Company profile is being generated</p>
                        </div>
                      )}
                      
                      {/* Intelligence Source Card */}
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
                            <div className={`w-3 h-3 rounded-full mr-2 ${areRedditResultsAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm">Social Mentions</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${isSummaryAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm">AI Analysis</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${isPdlDataAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm">Deal Intelligence</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Last Updated Card */}
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-start">
                          <Calendar className="text-blue-500 mr-3 mt-1" />
                          <div>
                            <h3 className="font-bold text-gray-900">Last Updated</h3>
                            <p className="text-gray-600 text-sm mt-1">{formatTimestamp(lastUpdated)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Deal Intelligence Tab */}
              {activeTab === 'deal-intelligence' && (
                <div className="p-6">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-white text-xl font-bold flex items-center">
                          <Rocket className="mr-2" size={20} />
                          Deal Intelligence Report: {displayName}
                        </h2>
                        <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                          <span className="text-white font-medium">Updated: {formatTimestamp(lastUpdated)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score & Stage Section */}
                    <div className="p-6 border-b grid grid-cols-2 gap-6">
                      <DealScoreIndicator score={pdlData?.dealScore || 50} />
                      <DealStageTimeline />
                    </div>
                    
                    {/* Key Factors Analysis */}
                    <DealFactorsAnalysis />
                    
                    {/* Critical Requirements & Next Stage */}
                    <CriticalRequirementsAndNextStage />
                    
                    {/* Market Intelligence */}
                    <MarketIntelligence />
                    
                    {/* Strategic Recommendations */}
                    <StrategicRecommendations />
                  </div>
                </div>
              )}
              
              {activeTab === 'ai' && (
                <div className="p-8 max-w-4xl mx-auto bg-white shadow-sm rounded-lg my-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Sales Intelligence</h2>
                  
                  {isSummaryAvailable ? (
                    <div className="prose prose-blue max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: formatMarkdown(researchData.summary) 
                      }} />
                    </div>
                  ) : (
                    <NoReportDisplay companyName={displayName} />
                  )}
                </div>
              )}
              
              {activeTab === 'company' && (
                <div className="p-8 max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Profile</h2>
                  
                  {isApolloDataAvailable ? (
                    <CompanyProfile data={apolloData} />
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                      <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700">{displayName}</h3>
                      <p className="text-gray-500 mt-3 max-w-md mx-auto">
                        We're currently gathering company information. Check back soon for detailed company insights.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'web' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Web Research</h2>
                  
                  {areGoogleResultsAvailable ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {googleData.map((item, index) => (
                        <GoogleNewsCard key={index} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                      <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No News Articles Found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        We couldn't find any recent news articles for {displayName}. Check back later for updates.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'social' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Insights</h2>
                  
                  {areRedditResultsAvailable ? (
                    <div className="space-y-4 max-w-4xl">
                      {redditData.map((post, index) => (
                        <RedditPostCard key={index} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Social Media Mentions</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        We couldn't find any recent social media mentions for {displayName}. Check back later for updates.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;