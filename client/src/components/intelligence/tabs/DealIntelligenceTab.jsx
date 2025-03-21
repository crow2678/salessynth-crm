// tabs/DealIntelligenceTab.jsx
import React from 'react';
import { 
 Rocket, 
 CheckCircle, 
 Clock, 
 AlertCircle,
 Check, 
 Shield, 
 BarChart, 
 Info, 
 TrendingUp, 
 FileText, 
 Calendar, 
 ExternalLink, 
 Globe, 
 GitBranch 
} from 'lucide-react';
import { formatTimestamp } from '../utils/intelligenceUtils';

// Deal Intelligence Components
const DealScoreIndicator = ({ score, reasoning }) => {
 // Early return if no score data to prevent rendering with placeholders
 if (score === undefined || score === null) {
   return (
     <div className="flex items-center justify-center py-4">
       <div className="text-center">
         <div className="mx-auto w-20 h-20 border-4 border-dashed border-gray-200 rounded-full flex items-center justify-center mb-3">
           <Rocket className="w-8 h-8 text-gray-300" />
         </div>
         <p className="text-gray-500 text-sm">No deal score available</p>
       </div>
     </div>
   );
 }

 const getScoreColor = (score) => {
   if (score >= 80) return "text-green-600";
   if (score >= 70) return "text-green-500";
   if (score >= 50) return "text-blue-500";
   if (score >= 30) return "text-yellow-500";
   return "text-orange-500";
 };

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
       <p className="text-gray-700 text-sm">{reasoning || "Analysis based on engagement patterns, client questions, and deal progression."}</p>
     </div>
   </div>
 );
};

const DealStageTimeline = ({ stageData = {} }) => {
 // Early return if no substantial stage data is available
 if (!stageData || Object.keys(stageData).length === 0 || 
     (!stageData.currentStage && !stageData.completedStages?.length && !stageData.upcomingStages?.length)) {
   return (
     <div className="border-l pl-6">
       <h4 className="font-medium text-gray-800 mb-2">Deal Stage Analysis</h4>
       <div className="relative">
         <div className="flex items-center justify-center py-4 text-center">
           <div className="text-gray-500 text-sm">
             <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
             <p>No deal stage data available</p>
           </div>
         </div>
       </div>
     </div>
   );
 }
 
 // Use provided data or empty arrays to prevent errors
 const completedStages = stageData.completedStages || [];
 const currentStage = stageData.currentStage || "Unknown";
 const upcomingStages = stageData.upcomingStages || [];

 return (
   <div className="border-l pl-6">
     <h4 className="font-medium text-gray-800 mb-2">Deal Stage Analysis</h4>
     <div className="relative">
       <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
       <div className="space-y-4 relative">
         {completedStages.map((stage, index) => (
           <div key={index} className="flex items-center">
             <div className="w-4 h-4 rounded-full bg-green-500 z-10 mr-3"></div>
             <span className="text-gray-600 text-sm">{stage}</span>
             <Check size={14} className="text-green-500 ml-2" />
           </div>
         ))}
         <div className="flex items-center">
           <div className="w-4 h-4 rounded-full bg-blue-500 z-10 mr-3"></div>
           <span className="text-gray-800 font-medium text-sm">{currentStage}</span>
           <Clock size={14} className="text-blue-500 ml-2" />
           <span className="text-xs text-gray-500 ml-2">{stageData.timeInStage || "Unknown"}</span>
         </div>
         {upcomingStages.map((stage, index) => (
           <div key={index} className="flex items-center">
             <div className="w-4 h-4 rounded-full bg-gray-300 z-10 mr-3"></div>
             <span className="text-gray-500 text-sm">{stage}</span>
             {index === 0 && stageData.nextStageLikelihood > 0 && (
               <span className="text-xs text-blue-600 ml-2">{stageData.nextStageLikelihood}% likelihood</span>
             )}
           </div>
         ))}
       </div>
     </div>
   </div>
 );
};

const DealFactorsAnalysis = ({ factorsData }) => {
 // Early return if no factors data is available
 if (!factorsData || 
     (!factorsData.positive?.length && !factorsData.negative?.length)) {
   return (
     <div className="p-6 border-b text-center">
       <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Success Factors</h3>
       <div className="py-4">
         <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
         <p className="text-gray-500 text-sm">No deal factors available</p>
       </div>
     </div>
   );
 }

 // Ensure we have arrays to work with even if data is partially empty
 const positiveFactors = factorsData.positive || [];
 const negativeFactors = factorsData.negative || [];

 return (
   <div className="p-6 border-b">
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Success Factors</h3>
     <div className="grid grid-cols-2 gap-4">
       <div className="space-y-3">
         <h4 className="font-medium text-green-600 flex items-center">
           <Check size={16} className="mr-1" />
           Positive Signals
         </h4>
         {positiveFactors.length > 0 ? (
           positiveFactors.map((factor, i) => (
             <div key={i} className="flex items-center">
               <div className="w-1 h-6 bg-green-500 rounded-sm mr-2"></div>
               <span className="text-gray-700 text-sm">{factor.description}</span>
               <div className="ml-auto flex">
                 {[...Array(Math.min(Math.ceil((factor.impact || 60) / 20), 5))].map((_, i) => (
                   <div key={i} className="w-1.5 h-1.5 mx-0.5 rounded-full bg-green-500" />
                 ))}
               </div>
             </div>
           ))
         ) : (
           <div className="text-gray-500 text-sm italic">No positive factors identified</div>
         )}
       </div>
       
       <div className="space-y-3">
         <h4 className="font-medium text-orange-600 flex items-center">
           <AlertCircle size={16} className="mr-1" />
           Potential Concerns
         </h4>
         {negativeFactors.length > 0 ? (
           negativeFactors.map((factor, i) => (
             <div key={i} className="flex items-center">
               <div className="w-1 h-6 bg-orange-500 rounded-sm mr-2"></div>
               <span className="text-gray-700 text-sm">{factor.description}</span>
               <div className="ml-auto flex">
                 {[...Array(Math.min(Math.ceil((factor.impact || 40) / 20), 5))].map((_, i) => (
                   <div key={i} className="w-1.5 h-1.5 mx-0.5 rounded-full bg-orange-500" />
                 ))}
               </div>
             </div>
           ))
         ) : (
           <div className="text-gray-500 text-sm italic">No concerns identified</div>
         )}
       </div>
     </div>
   </div>
 );
};

const CriticalRequirementsAndNextStage = ({ requirements, nextStageData }) => {
 const hasRequirements = requirements && Array.isArray(requirements) && requirements.length > 0;
 const hasNextStageData = nextStageData && Object.keys(nextStageData).length > 0;
 
 // Early return if no data is available for both sections
 if (!hasRequirements && !hasNextStageData) {
   return (
     <div className="p-6 border-b text-center">
       <h3 className="text-lg font-semibold text-gray-800 mb-4">Client Requirements & Next Stage</h3>
       <div className="py-4">
         <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
         <p className="text-gray-500 text-sm">No requirements or next stage data available</p>
       </div>
     </div>
   );
 }

 return (
   <div className="p-6 border-b grid grid-cols-2 gap-6">
     <div>
       <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
         <Info size={18} className="mr-2 text-blue-500" />
         Critical Client Requirements
       </h3>
       {hasRequirements ? (
         <div className="space-y-2">
           {requirements.map((req, idx) => (
             <div key={idx} className="rounded-md border border-blue-100 bg-blue-50 p-3">
               <h4 className="font-medium text-blue-800">{req.title}</h4>
               <p className="text-sm text-blue-700 mt-1">{req.description}</p>
             </div>
           ))}
         </div>
       ) : (
         <div className="text-center py-4">
           <p className="text-gray-500 text-sm">No client requirements identified</p>
         </div>
       )}
     </div>
     
     <div>
       <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
         <TrendingUp size={18} className="mr-2 text-green-500" />
         Next Stage Analysis
       </h3>
       {hasNextStageData ? (
         <div className="space-y-4">
           <div className="flex items-center justify-between">
             <span className="text-gray-700">Timeframe:</span>
             <span className="font-medium">{nextStageData.timeframe || "Unknown"}</span>
           </div>
           <div className="flex items-center justify-between">
             <span className="text-gray-700">Potential Value:</span>
             <span className="font-medium text-green-700">{nextStageData.value || "Unknown"}</span>
           </div>
           {nextStageData.blockers && nextStageData.blockers.length > 0 && (
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
           )}
         </div>
       ) : (
         <div className="text-center py-4">
           <p className="text-gray-500 text-sm">No next stage analysis available</p>
         </div>
       )}
     </div>
   </div>
 );
};

const MarketIntelligence = ({ marketData }) => {
 const hasMarketData = marketData && Array.isArray(marketData) && marketData.length > 0;
 
 // Early return if no market data is available
 if (!hasMarketData) {
   return (
     <div className="p-6 border-b text-center">
       <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
         <BarChart size={18} className="mr-2 text-indigo-500" />
         Market Intelligence
       </h3>
       <div className="py-4">
         <Globe className="h-8 w-8 text-gray-300 mx-auto mb-3" />
         <p className="text-gray-500 text-sm">No market intelligence data available</p>
       </div>
     </div>
   );
 }

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
             {item.url && (
               <a 
                 href={item.url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="ml-2 text-gray-400 hover:text-gray-600"
               >
                 <ExternalLink size={14} />
               </a>
             )}
           </h4>
           <p className="text-sm text-gray-500 mt-1">{item.source} • {item.date}</p>
           <p className="text-sm text-gray-700 mt-2">{item.snippet}</p>
         </div>
       ))}
     </div>
   </div>
 );
};

const StrategicRecommendations = ({ recommendations }) => {
 const hasRecommendations = recommendations && Array.isArray(recommendations) && recommendations.length > 0;
 
 // Early return if no recommendations are available
 if (!hasRecommendations) {
   return (
     <div className="p-6 bg-gray-50 text-center">
       <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
         <Shield size={18} className="mr-2 text-green-600" />
         Strategic Recommendations
       </h3>
       <div className="py-4">
         <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
         <p className="text-gray-500 text-sm">No strategic recommendations available</p>
       </div>
     </div>
   );
 }

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

// Main Deal Intelligence Tab Component
const DealIntelligenceTab = ({ pdlData, displayName, lastUpdated, isLoading }) => {
 const isPdlDataAvailable = pdlData && Object.keys(pdlData).length > 0 && pdlData.dealScore > 0;
 
 return (
   <div className="p-6">
     {isLoading ? (
       <div className="text-center py-16 bg-white rounded-lg shadow-sm">
         <Rocket className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
         <h3 className="text-xl font-semibold text-gray-700 mb-2">Deal intelligence is being generated...</h3>
         <p className="text-gray-500 max-w-md mx-auto">
           We're analyzing your interaction data to generate tailored intelligence.
           This might take a few moments.
         </p>
       </div>
     ) : isPdlDataAvailable ? (
       <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
         
         <div className="p-6 border-b grid grid-cols-2 gap-6">
           <DealScoreIndicator 
             score={pdlData.dealScore} 
             reasoning={pdlData.reasoning} 
           />
           <DealStageTimeline stageData={pdlData.stageData} />
         </div>
         
         <DealFactorsAnalysis factorsData={pdlData.factors} />
         
         <CriticalRequirementsAndNextStage 
           requirements={pdlData.requirements} 
           nextStageData={pdlData.nextStage} 
         />
         
         <MarketIntelligence marketData={pdlData.marketData} />
         
         <StrategicRecommendations recommendations={pdlData.recommendations} />
       </div>
     ) : (
       <div className="text-center py-16 bg-white rounded-lg shadow-sm">
         <Rocket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
         <h3 className="text-xl font-semibold text-gray-700 mb-2">Deal Intelligence Coming Soon</h3>
         <p className="text-gray-500 max-w-md mx-auto">
           We're analyzing your interaction data to generate tailored deal intelligence. 
           This information will help predict deal success and provide strategic recommendations.
         </p>
       </div>
     )}
   </div>
 );
};

export default DealIntelligenceTab;