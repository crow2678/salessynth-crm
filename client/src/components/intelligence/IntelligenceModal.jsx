import React, { useState, useEffect } from 'react';
import { X, Rocket, Maximize2, Minimize2 } from 'lucide-react';

const EnhancedIntelligenceModal = ({ isOpen, onClose, children, title = "Intelligence Center" }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative flex items-center justify-center min-h-screen p-4 transition-all duration-300 ${
        isMaximized ? 'p-2' : 'p-4 md:p-8'
      }`}>
        <div 
          className={`relative bg-white rounded-lg shadow-2xl transition-all duration-300 ${
            isMaximized 
              ? 'w-full h-full max-w-none max-h-none' 
              : 'w-full max-w-7xl max-h-[90vh]'
          } flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-blue-100 text-sm">AI-Powered Sales Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo component showing how to use the enhanced modal
const DemoIntelligenceModal = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="p-8">
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Open Intelligence Modal
      </button>

      <EnhancedIntelligenceModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Intelligence Center - ROB LUPOLI"
      >
        <div className="p-6">
          <div className="space-y-6">
            {/* Company Overview Section */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Chase</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Employees</p>
                  <p className="text-2xl font-bold text-blue-900">17,419</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-bold text-green-900">Public Subsidiary</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Industry</p>
                  <p className="text-lg font-bold text-purple-900">Financial Services</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-lg font-bold text-orange-900">New York</p>
                </div>
              </div>
            </div>

            {/* Sample expandable sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Recent News</h4>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-medium">Chase's new Minnesota HQ</h5>
                    <p className="text-sm text-gray-600">Includes private bank for wealthy clients</p>
                    <p className="text-xs text-gray-500">Star Tribune • May 22, 2025</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h5 className="font-medium">Business Banking Growth</h5>
                    <p className="text-sm text-gray-600">CEO eyes growth in Houston's market</p>
                    <p className="text-xs text-gray-500">Business Journals • Mar 20, 2025</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Deal Intelligence</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Deal Score</span>
                    <span className="text-2xl font-bold text-green-600">75</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-sm text-gray-700">
                    Strong engagement with detailed questions. Deal value is substantial at $300,000.
                  </p>
                </div>
              </div>
            </div>

            {/* More content sections to demonstrate scrolling */}
            <div className="bg-white border rounded-lg p-6">
              <h4 className="font-bold text-lg mb-4">Employee Distribution</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">United States</span>
                  <span className="text-sm font-medium">16,622 (95.4%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95.4%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">United Kingdom</span>
                  <span className="text-sm font-medium">170 (1.0%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '1%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">India</span>
                  <span className="text-sm font-medium">159 (0.9%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0.9%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EnhancedIntelligenceModal>
    </div>
  );
};

export default DemoIntelligenceModal;