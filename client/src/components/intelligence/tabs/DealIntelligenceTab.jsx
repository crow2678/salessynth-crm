import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  Calendar
} from 'lucide-react';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

const DealIntelligenceTab = ({ clientId, userId }) => {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState('overview');

  // Function to fetch deal intelligence data
  const fetchDealIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/summary/${clientId}/${userId}`);
      
      // Extract deal intelligence from research data
      if (response.data && response.data.data && response.data.data.dealIntelligence) {
        setIntelligence(response.data.data.dealIntelligence);
      } else {
        setError('No deal intelligence available');
      }
    } catch (err) {
      console.error('Error fetching deal intelligence:', err);
      setError(err.response?.data?.message || 'Failed to load deal intelligence');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (clientId && userId) {
      fetchDealIntelligence();
    }
  }, [clientId, userId]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading deal intelligence...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Unable to load deal intelligence</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Render not available state
  if (!intelligence) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Zap className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-blue-800 mb-2">Deal Intelligence Coming Soon</h3>
        <p className="text-blue-600">We're analyzing your deal data to provide insights.</p>
      </div>
    );
  }

  // Handle message-only cases (no deals or closed deals)
  if (intelligence.message) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Zap className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          {intelligence.hasDeals === false ? 'No Deals Found' : 'Deals Already Closed'}
        </h3>
        <p className="text-blue-600">{intelligence.message}</p>
        
		{intelligence.recommendations.map((rec, index) => (
		  <li key={index} className="flex items-start">
			<CheckCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
			<span>
			  {typeof rec === 'string' ? rec : 
				(rec.title ? 
				  <>
					<strong>{rec.title}</strong>: {rec.description}
				  </> : 
				  JSON.stringify(rec)
				)
			  }
			</span>
		  </li>
		))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Calculate score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate impact color
  const getImpactColor = (impact) => {
    if (impact >= 80) return 'bg-green-100 text-green-800';
    if (impact >= 60) return 'bg-blue-100 text-blue-800';
    if (impact >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Deal Score Overview */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Deal Intelligence</h2>
          <div className="flex items-center">
            <div className={`text-2xl font-bold ${getScoreColor(intelligence.dealScore)}`}>
              {intelligence.dealScore}%
            </div>
            <div className="ml-2 text-sm text-gray-500">success probability</div>
          </div>
        </div>
        
        <p className="text-gray-600">{intelligence.reasoning}</p>
        
        {/* Deal Stage Progress */}
        {intelligence.stageData && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Deal Stage Progress</h3>
            <div className="flex items-center space-x-1">
              {['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won'].map((stage, index) => {
                const isCompleted = intelligence.stageData.completedStages.includes(stage);
                const isCurrent = intelligence.stageData.currentStage === stage;
                
                return (
                  <div key={stage} className="flex items-center">
                    <div 
                      className={`h-3 w-16 rounded-full ${
                        isCompleted ? 'bg-blue-500' : 
                        isCurrent ? 'bg-blue-300' : 'bg-gray-200'
                      }`}
                    />
                    {index < 4 && (
                      <div className="w-2 h-2 mx-1">•</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Prospecting</span>
              <span>Qualified</span>
              <span>Proposal</span>
              <span>Negotiation</span>
              <span>Closed</span>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Sections */}
      {/* Factors Section */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection('factors')}
          className="flex items-center justify-between w-full px-6 py-4 text-left"
        >
          <div className="flex items-center">
            {expandedSection === 'factors' ? (
              <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
            )}
            <h3 className="font-medium text-gray-800">Success Factors</h3>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 mr-3">{intelligence.factors?.positive?.length || 0} positive</span>
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-600">{intelligence.factors?.negative?.length || 0} negative</span>
          </div>
        </button>
        
        {expandedSection === 'factors' && (
          <div className="px-6 pb-6">
            {intelligence.factors?.positive?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Positive Factors</h4>
                <div className="space-y-2">
                  {intelligence.factors.positive.map((factor, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{factor.description}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getImpactColor(factor.impact)}`}>
                        {factor.impact}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {intelligence.factors?.negative?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Factors</h4>
                <div className="space-y-2">
                  {intelligence.factors.negative.map((factor, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-start">
                        <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{factor.description}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getImpactColor(factor.impact)}`}>
                        {factor.impact}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Requirements Section */}
      {intelligence.requirements?.length > 0 && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('requirements')}
            className="flex items-center justify-between w-full px-6 py-4 text-left"
          >
            <div className="flex items-center">
              {expandedSection === 'requirements' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
              )}
              <h3 className="font-medium text-gray-800">Customer Requirements</h3>
            </div>
            <span className="text-sm text-gray-500">{intelligence.requirements.length} identified</span>
          </button>
          
          {expandedSection === 'requirements' && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {intelligence.requirements.map((req, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-800 mb-1">{req.title}</div>
                    <div className="text-gray-600 text-sm">{req.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Stage Section */}
      {intelligence.nextStage && Object.keys(intelligence.nextStage).length > 0 && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('nextStage')}
            className="flex items-center justify-between w-full px-6 py-4 text-left"
          >
            <div className="flex items-center">
              {expandedSection === 'nextStage' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
              )}
              <h3 className="font-medium text-gray-800">Path to Next Stage</h3>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">{intelligence.nextStage.timeframe}</span>
            </div>
          </button>
          
          {expandedSection === 'nextStage' && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Potential Value</div>
                  <div className="text-xl font-semibold text-blue-700">{intelligence.nextStage.value}</div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Next Stage Probability</div>
                  <div className="text-xl font-semibold text-blue-700">
                    {intelligence.stageData?.nextStageLikelihood || 'Unknown'}%
                  </div>
                </div>
              </div>
              
              {intelligence.nextStage.blockers && intelligence.nextStage.blockers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Potential Blockers</h4>
                  <ul className="space-y-2">
                    {intelligence.nextStage.blockers.map((blocker, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{blocker}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Section */}
      {intelligence.recommendations?.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('recommendations')}
            className="flex items-center justify-between w-full px-6 py-4 text-left"
          >
            <div className="flex items-center">
              {expandedSection === 'recommendations' ? (
                <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
              )}
              <h3 className="font-medium text-gray-800">Recommendations</h3>
            </div>
            <span className="text-sm text-gray-500">{intelligence.recommendations.length} actions</span>
          </button>
          
          {expandedSection === 'recommendations' && (
            <div className="px-6 pb-6">
              <ul className="space-y-2">
                {intelligence.recommendations.map((rec, index) => (
				  <li key={index} className="flex items-start">
					<Zap className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
					<span className="text-gray-700">
					  {typeof rec === 'string' ? rec : 
						(rec.title ? 
						  <>
							<strong>{rec.title}</strong>: {rec.description}
						  </> : 
						  JSON.stringify(rec)
						)
					  }
					</span>
				  </li>
				))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DealIntelligenceTab;