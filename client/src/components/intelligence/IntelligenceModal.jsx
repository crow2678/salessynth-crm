import React, { useState } from 'react';
import { X, Rocket, Briefcase, Building, Search, Users, LayoutDashboard } from 'lucide-react';
import DealIntelligenceTab from './DealIntelligenceTab';
import CompanyTab from './tabs/CompanyTab';
import ProfileTab from './tabs/ProfileTab';
import WebResearchTab from './tabs/WebResearchTab';
import DashboardTab from './tabs/DashboardTab';

const IntelligenceModal = ({ 
  isOpen, 
  onClose, 
  clientId, 
  userId, 
  clientName,
  researchData
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Include all available tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'deal', label: 'Deal Intelligence', icon: <Briefcase className="h-5 w-5" /> },
    { id: 'company', label: 'Company Research', icon: <Building className="h-5 w-5" /> },
    { id: 'profile', label: 'Contact Profile', icon: <Users className="h-5 w-5" /> },
    { id: 'web', label: 'Web Research', icon: <Search className="h-5 w-5" /> }
  ];

  // If modal is not open, don't render
  if (!isOpen) return null;

  // Extract data from the nested structure
  const apolloData = researchData?.data?.apollo || null;
  const googleData = researchData?.data?.google || [];
  const pdlData = researchData?.data?.pdl || null;
  const dealIntelligence = researchData?.data?.dealIntelligence || null;
  const lastUpdated = researchData?.timestamp || null;
  const summary = researchData?.summary || null;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center space-x-3">
            <Rocket className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Intelligence Center</h2>
              <p className="text-sm text-blue-100">{clientName || 'Client Intelligence'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          {activeTab === 'dashboard' && (
            <DashboardTab 
              researchData={{ summary }}
              googleData={googleData}
              apolloData={apolloData}
              pdlData={pdlData}
              displayName={clientName}
              lastUpdated={lastUpdated}
              handleTabClick={handleTabClick}
            />
          )}
          
          {activeTab === 'deal' && (
            <DealIntelligenceTab 
              clientId={clientId} 
              userId={userId} 
            />
          )}
          
          {activeTab === 'company' && (
            <CompanyTab 
              apolloData={apolloData}
              pdlData={pdlData}
              displayName={clientName}
            />
          )}
          
          {activeTab === 'profile' && (
            <ProfileTab 
              pdlData={pdlData}
            />
          )}
          
          {activeTab === 'web' && (
            <WebResearchTab 
              googleData={googleData}
              displayName={clientName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;