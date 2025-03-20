// tabs/WebResearchTab.jsx
import React from 'react';
import { Search } from 'lucide-react';
import { GoogleNewsCard } from '../common/CommonComponents';

const WebResearchTab = ({ googleData, displayName }) => {
  const areGoogleResultsAvailable = googleData && Array.isArray(googleData) && googleData.length > 0;

  return (
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
  );
};

export default WebResearchTab;