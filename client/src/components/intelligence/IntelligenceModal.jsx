import React, { useState } from 'react';
import { X, Rocket, MessageSquare, PieChart, Briefcase, Info } from 'lucide-react';
import DealIntelligenceTab from './tabs/DealIntelligenceTab';

const IntelligenceModal = ({ isOpen, onClose, clientId, userId, clientName }) => {
  const [activeTab, setActiveTab] = useState('deal');

  const tabs = [
    { id: 'deal', label: 'Deal Intelligence', icon: <Briefcase className="h-5 w-5" /> },
    { id: 'company', label: 'Company Research', icon: <Info className="h-5 w-5" />, disabled: true },
    { id: 'social', label: 'Social Intelligence', icon: <MessageSquare className="h-5 w-5" />, disabled: true },
    { id: 'market', label: 'Market Analysis', icon: <PieChart className="h-5 w-5" />, disabled: true }
  ];

  // If modal is not open, don't render
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
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
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors relative
                ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : tab.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              disabled={tab.disabled}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.disabled && (
                <span className="absolute top-2 right-2 text-xs py-0.5 px-1.5 bg-gray-100 text-gray-500 rounded-full">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          {activeTab === 'deal' && (
            <DealIntelligenceTab 
              clientId={clientId} 
              userId={userId} 
            />
          )}
          
          {activeTab === 'company' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-800 mb-2">Company Research</h3>
              <p className="text-blue-600">
                Advanced company research capabilities are coming soon.
              </p>
            </div>
          )}
          
          {activeTab === 'social' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-800 mb-2">Social Intelligence</h3>
              <p className="text-blue-600">
                Social media intelligence capabilities are coming soon.
              </p>
            </div>
          )}
          
          {activeTab === 'market' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <PieChart className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-800 mb-2">Market Analysis</h3>
              <p className="text-blue-600">
                Market analysis capabilities are coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;