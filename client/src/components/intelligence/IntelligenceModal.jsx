// IntelligenceModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  MessageCircle, 
  ChevronRight,
  X, 
  TrendingUp,
  Rocket,
  Users,
  Building,
  Globe,
  Calendar
} from 'lucide-react';
import axios from 'axios';

// Import tab components
import DashboardTab from './tabs/DashboardTab';
import DealIntelligenceTab from './tabs/DealIntelligenceTab';
import ProfileTab from './tabs/ProfileTab';
import CompanyTab from './tabs/CompanyTab';
import WebResearchTab from './tabs/WebResearchTab';

// Import common components
import { LoadingSkeleton, ErrorDisplay, NoReportDisplay } from './common/CommonComponents';

// Import utilities
import { formatTimestamp, generateDealIntelligence } from './utils/intelligenceUtils';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

const IntelligenceModal = ({ isOpen, onClose, clientId, userId, clientName }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [researchData, setResearchData] = useState(null);
  const [googleData, setGoogleData] = useState(null);
  const [apolloData, setApolloData] = useState(null);
  const [pdlData, setPdlData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dealIntelligenceLoading, setDealIntelligenceLoading] = useState(false);

  useEffect(() => {
    if (!clientId || !userId || !isOpen) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch research data
        const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
        const data = response.data;
        
        if (!data) {
          setError("No research data available for this client.");
          setLoading(false);
          return;
        }
        
        setResearchData(data);
        setGoogleData(data.data?.google || []);
        setApolloData(data.data?.apollo || null);
        setLastUpdated(data.timestamp || null);
        
        // Generate deal intelligence using GPT
        setDealIntelligenceLoading(true);
        try {
          const dealIntelligence = await generateDealIntelligence(clientId, userId, API_URL);
          setPdlData(dealIntelligence);
        } catch (err) {
          console.error("Error generating deal intelligence:", err);
          // Continue with other data even if deal intelligence fails
        } finally {
          setDealIntelligenceLoading(false);
        }
      } catch (err) {
        console.error("Error fetching research data:", err.response?.data || err.message);
        setError(err.response?.status === 404 
          ? "No research data available for this client yet."
          : "Failed to load research data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId, userId, isOpen]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  const displayName = apolloData?.company?.name || researchData?.companyName || clientName || "Company";
  
  // Dynamic title based on available data
  let dynamicTitle = "Sales Intelligence";
  const isPdlDataAvailable = pdlData && Object.keys(pdlData).length > 0 && pdlData.dealScore > 0;
  const areGoogleResultsAvailable = googleData && Array.isArray(googleData) && googleData.length > 0;
  const isApolloDataAvailable = apolloData && Object.keys(apolloData).length > 0;
  
  if (isPdlDataAvailable && (areGoogleResultsAvailable || isApolloDataAvailable)) {
    dynamicTitle = "360° Intelligence Brief";
  } else if (isPdlDataAvailable) {
    dynamicTitle = "Deal Intelligence";
  } else if (isApolloDataAvailable) {
    dynamicTitle = "Company Intelligence Profile";
  } else if (areGoogleResultsAvailable) {
    dynamicTitle = "Market Intelligence Report";
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
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
        
        {/* Tabs */}
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
            className={`flex items-center px-6 py-3 border-b-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabClick('profile')}
          >
            <Users className="w-5 h-5 mr-2" />
            <span>Profile</span>
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
                <DashboardTab 
                  researchData={researchData}
                  googleData={googleData}
                  apolloData={apolloData}
                  pdlData={pdlData}
                  displayName={displayName}
                  lastUpdated={lastUpdated}
                  dealIntelligenceLoading={dealIntelligenceLoading}
                  handleTabClick={handleTabClick}
                />
              )}
              
              {activeTab === 'deal-intelligence' && (
                <DealIntelligenceTab 
                  pdlData={pdlData}
                  displayName={displayName}
                  lastUpdated={lastUpdated}
                  isLoading={dealIntelligenceLoading}
                />
              )}
              
              {activeTab === 'profile' && (
                <ProfileTab pdlData={pdlData} />
              )}
              
              {activeTab === 'company' && (
                <CompanyTab 
                  apolloData={apolloData}
                  pdlData={pdlData}
                  displayName={displayName}
                />
              )}
              
              {activeTab === 'web' && (
                <WebResearchTab 
                  googleData={googleData}
                  displayName={displayName}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;