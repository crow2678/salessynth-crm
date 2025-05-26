// Updated IntelligenceModal.jsx with PDF download functionality
import React, { useState, useEffect, useRef } from 'react';
import { X, Rocket, Briefcase, Building, Search, Users, LayoutDashboard, Download, FileText } from 'lucide-react';
import DealIntelligenceTab from './tabs/DealIntelligenceTab';
import CompanyTab from './tabs/CompanyTab';
import ProfileTab from './tabs/ProfileTab';
import WebResearchTab from './tabs/WebResearchTab';
import DashboardTab from './tabs/DashboardTab';
import { generateIntelligenceReport, generateModalScreenshotPDF } from '../utils/pdfGenerator';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

const IntelligenceModal = ({ 
  isOpen, 
  onClose, 
  clientId, 
  userId, 
  clientName 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [researchData, setResearchData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPDFOptions, setShowPDFOptions] = useState(false);
  const modalRef = useRef(null);

  // Fetch data when modal opens or when clientId/userId changes
  useEffect(() => {
    const fetchResearchData = async () => {
      if (!clientId || !userId || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
        console.log("Research data loaded:", response.data);
        setResearchData(response.data);
      } catch (err) {
        console.error('Error fetching research data:', err);
        setError(err.response?.data?.message || 'Failed to load intelligence data');
      } finally {
        setLoading(false);
      }
    };

    fetchResearchData();
  }, [clientId, userId, isOpen]);

  // PDF Generation Handlers
  const handleGenerateStructuredPDF = async () => {
    setIsGeneratingPDF(true);
    setShowPDFOptions(false);
    
    try {
      const result = await generateIntelligenceReport(
        researchData?.dealIntelligence,
        clientName,
        {
          includeAllSections: true,
          includeCharts: true,
          includeMetadata: true
        }
      );
      
      if (result.success) {
        // You could show a success toast here
        console.log('PDF generated successfully:', result.fileName);
      } else {
        console.error('PDF generation failed:', result.message);
        // You could show an error toast here
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleGenerateScreenshotPDF = async () => {
    setIsGeneratingPDF(true);
    setShowPDFOptions(false);
    
    try {
      if (modalRef.current) {
        const result = await generateModalScreenshotPDF(modalRef.current, clientName);
        
        if (result.success) {
          console.log('Screenshot PDF generated successfully:', result.fileName);
        } else {
          console.error('Screenshot PDF generation failed:', result.message);
        }
      }
    } catch (error) {
      console.error('Error generating screenshot PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'deal', label: 'Deal Intelligence', icon: <Briefcase className="h-5 w-5" /> },
    { id: 'company', label: 'Company Research', icon: <Building className="h-5 w-5" /> },
    { id: 'profile', label: 'Contact Profile', icon: <Users className="h-5 w-5" /> },
    { id: 'web', label: 'Web Research', icon: <Search className="h-5 w-5" /> }
  ];

  if (!isOpen) return null;

  const apolloData = researchData?.data?.apollo || null;
  const googleData = researchData?.data?.google || [];
  const pdlData = researchData?.data?.pdl || null;
  const dealIntelligence = researchData?.dealIntelligence || null;
  const summary = researchData?.summary || null;
  const lastUpdated = researchData?.timestamp || null;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-hidden"
        style={{ width: '95vw', height: '90vh' }} // Increased size
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center space-x-3">
            <Rocket className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Intelligence Center</h2>
              <p className="text-sm text-blue-100">{clientName || 'Client Intelligence'}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* PDF Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPDFOptions(!showPDFOptions)}
                disabled={isGeneratingPDF || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                </span>
              </button>
              
              {/* PDF Options Dropdown */}
              {showPDFOptions && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border z-50">
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose Report Type</h3>
                    
                    <button
                      onClick={handleGenerateStructuredPDF}
                      className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Structured Report</div>
                        <div className="text-sm text-gray-500">Professional formatted report with charts and analysis</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleGenerateScreenshotPDF}
                      className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Download className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Visual Capture</div>
                        <div className="text-sm text-gray-500">High-quality screenshot of current view</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap
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
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading intelligence data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-500 mb-2 text-lg font-semibold">Error loading data</div>
            <div className="text-gray-500">{error}</div>
          </div>
        ) : (
          <div className="overflow-auto" style={{ height: 'calc(90vh - 140px)' }}>
            {activeTab === 'dashboard' && (
              <DashboardTab 
                researchData={{ summary: summary }}
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
        )}
        
        {/* Click outside to close PDF options */}
        {showPDFOptions && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPDFOptions(false)}
          />
        )}
      </div>
    </div>
  );
};

export default IntelligenceModal;