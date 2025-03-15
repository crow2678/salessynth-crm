// src/components/predictions/PredictionVisualization.jsx
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowUp, 
  ArrowDown, 
  Check, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Zap,
  Layers,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const COLORS = {
  primary: '#3b82f6', // blue-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444',  // red-500
  neutral: '#6b7280'  // gray-500
};

/**
 * Prediction Visualization Component
 * 
 * Renders various visualizations for deal prediction data
 * 
 * @param {Object} prediction - The prediction data object
 * @param {Object} deal - Optional deal data
 * @param {string} type - Type of visualization to display (default: 'score')
 * @param {boolean} compact - Whether to display a compact version
 * @param {Function} onFeedback - Optional callback for feedback
 */
const PredictionVisualization = ({ 
  prediction, 
  deal = null,
  type = 'score', 
  compact = false,
  onFeedback = null
}) => {
  const [activeView, setActiveView] = useState(type);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: null,
    feedbackType: 'general',
    comments: ''
  });
  
  if (!prediction) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
          <p>No prediction data available</p>
        </div>
      </div>
    );
  }
  
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Helper function to determine color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.primary;
    if (score >= 40) return COLORS.warning;
    return COLORS.danger;
  };
  
  // Helper function to determine status label based on score
  const getScoreLabel = (score) => {
    if (score >= 80) return "Highly Likely";
    if (score >= 60) return "Promising";
    if (score >= 40) return "Uncertain";
    return "Challenging";
  };
  
  // Helper function to display change indicator
  const ChangeIndicator = ({ current, previous }) => {
    if (!previous || current === previous) return null;
    
    const diff = current - previous;
    const isPositive = diff > 0;
    
    return (
      <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUp className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDown className="h-3 w-3 mr-1" />
        )}
        <span>{Math.abs(diff)}%</span>
      </div>
    );
  };
  
  // Function to render the score visualization
  const renderScoreView = () => {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-lg border border-gray-200`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className={`${compact ? 'text-md' : 'text-lg'} font-semibold text-gray-900`}>Success Probability</h3>
          
          {!compact && (
            <div className="flex space-x-1">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {formatDate(prediction.predictedAt)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="relative w-24 h-24 mr-4">
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
                stroke={getScoreColor(prediction.probability)}
                strokeWidth="10"
                strokeDasharray={`${prediction.probability * 2.83} 283`}
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
                {Math.round(prediction.probability)}%
              </text>
            </svg>
          </div>
          
          <div>
            <div className="mb-1">
              <span className="text-xl font-bold" style={{ color: getScoreColor(prediction.probability) }}>
                {getScoreLabel(prediction.probability)}
              </span>
              
              {prediction.previousProbability && !compact && (
                <ChangeIndicator current={prediction.probability} previous={prediction.previousProbability} />
              )}
            </div>
            
            {!compact && (
              <p className="text-gray-700 text-sm">
                Based on {prediction.dataSources?.length || 0} data sources and {prediction.factors?.positive?.length || 0} positive factors.
              </p>
            )}
            
            {prediction.predictedCloseDate && !compact && (
              <div className="mt-3 flex items-center text-sm text-gray-700">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                <span>Predicted close: {formatDate(prediction.predictedCloseDate)}</span>
              </div>
            )}
          </div>
        </div>
        
        {!compact && (
          <>
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm">
                <span className="text-gray-500">Confidence</span>
                <div className="font-medium">{prediction.confidenceScore || 85}%</div>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-500">Next Stage</span>
                <div className="font-medium">{prediction.predictedStage || 'Unknown'}</div>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-500">Time to Close</span>
                <div className="font-medium">{prediction.timeToCloseEstimate || 'Unknown'} days</div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-900">Positive Factors ({prediction.factors?.positive?.length || 0})</h4>
                <button 
                  onClick={() => setActiveView('factors')}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </button>
              </div>
              
              <ul className="space-y-1">
                {prediction.factors?.positive?.slice(0, 2).map((factor, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Function to render the factors visualization
  const renderFactorsView = () => {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Success Factors</h3>
          
          <button 
            onClick={() => setActiveView('score')} 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Score
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              Positive Factors
            </h4>
            
            <ul className="space-y-3">
              {prediction.factors?.positive?.map((factor, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-1 h-6 bg-green-500 rounded-sm mr-3 mt-0.5"></div>
                  <span className="text-gray-700">{factor}</span>
                </li>
              ))}
            </ul>
            
            {prediction.factors?.positive?.length === 0 && (
              <p className="text-gray-500 italic">No positive factors identified</p>
            )}
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Risk Factors
            </h4>
            
            <ul className="space-y-3">
              {prediction.factors?.negative?.map((factor, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-1 h-6 bg-orange-500 rounded-sm mr-3 mt-0.5"></div>
                  <span className="text-gray-700">{factor}</span>
                </li>
              ))}
            </ul>
            
            {prediction.factors?.negative?.length === 0 && (
              <p className="text-gray-500 italic">No risk factors identified</p>
            )}
          </div>
        </div>
        
        {onFeedback && !showFeedback && (
          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={() => setShowFeedback(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Provide feedback on this prediction
            </button>
          </div>
        )}
        
        {onFeedback && showFeedback && (
          <div className="mt-8 pt-4 border-t border-gray-100">
            <h4 className="text-md font-medium text-gray-900 mb-3">Feedback</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How accurate is this prediction?
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFeedback({ ...feedback, rating })}
                      className={`w-10 h-10 rounded-full ${
                        feedback.rating === rating ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' : 
                        'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback Type
                </label>
                <select
                  value={feedback.feedbackType}
                  onChange={(e) => setFeedback({ ...feedback, feedbackType: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="general">General Feedback</option>
                  <option value="accuracy">Accuracy Feedback</option>
                  <option value="factor">Factor Feedback</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments
                </label>
                <textarea
                  value={feedback.comments}
                  onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Please share any additional feedback..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onFeedback(feedback);
                    setShowFeedback(false);
                    setFeedback({
                      rating: null,
                      feedbackType: 'general',
                      comments: ''
                    });
                  }}
                  disabled={!feedback.rating}
                  className={`px-4 py-2 text-sm text-white rounded-md ${
                    feedback.rating ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Function to render the timeline visualization
  const renderTimelineView = () => {
    // Skip this view if we don't have stage estimates
    if (!prediction.stageEstimates || prediction.stageEstimates.length === 0) {
      return renderScoreView();
    }
    
    // Format data for the chart
    const timelineData = prediction.stageEstimates.map(stage => ({
      name: stage.stage,
      days: stage.estimatedDays
    }));
    
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Timeline Prediction</h3>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveView('score')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Score
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Estimated Days Per Stage
          </h4>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timelineData}
                margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Days', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: 12 }
                  }}
                />
                <Tooltip />
                <Bar dataKey="days" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500">Predicted Close Date</span>
            <div className="font-medium">{formatDate(prediction.predictedCloseDate)}</div>
          </div>
          
          <div>
            <span className="text-gray-500">Total Days to Close</span>
            <div className="font-medium">{prediction.timeToCloseEstimate} days</div>
          </div>
          
          <div>
            <span className="text-gray-500">Confidence</span>
            <div className="font-medium">{prediction.confidenceScore}%</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Function to render the trends visualization if history is available
  const renderTrendsView = () => {
    // Skip this view if we don't have prediction history
    if (!deal || !deal.predictions || deal.predictions.length < 2) {
      return renderScoreView();
    }
    
    // Format data for the chart - reverse and limit to last 10
    const trendsData = [...deal.predictions]
      .sort((a, b) => new Date(a.predictedAt) - new Date(b.predictedAt))
      .slice(-10)
      .map(p => ({
        date: formatDate(p.predictedAt),
        probability: p.probability,
        confidence: p.confidenceScore
      }));
    
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Prediction Trends</h3>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveView('score')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Score
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Probability Over Time
          </h4>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendsData}
                margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  label={{ 
                    value: 'Percentage', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: 12 }
                  }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="probability" 
                  stroke={COLORS.primary} 
                  activeDot={{ r: 8 }}
                  name="Success Probability"
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke={COLORS.neutral} 
                  strokeDasharray="3 3"
                  name="Confidence Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            {trendsData.length > 1 && (
              <div className="mr-4">
                <span className="text-gray-500 block">Trend</span>
                <div className="font-medium flex items-center">
                  {trendsData[trendsData.length - 1].probability > trendsData[0].probability ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      <span className="text-green-600">Improving</span>
                    </>
                  ) : trendsData[trendsData.length - 1].probability < trendsData[0].probability ? (
                    <>
                      <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                      <span className="text-red-600">Declining</span>
                    </>
                  ) : (
                    <>
                      <Layers className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Stable</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <span className="text-gray-500 block">Predictions</span>
              <div className="font-medium">{deal.predictions.length}</div>
            </div>
          </div>
          
          <div>
            <span className="text-gray-500 block">Initial</span>
            <div className="font-medium">{trendsData[0]?.probability || 'N/A'}%</div>
          </div>
          
          <div>
            <span className="text-gray-500 block">Current</span>
            <div className={`font-medium`} style={{ color: getScoreColor(prediction.probability) }}>
              {prediction.probability}%
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the appropriate view based on the activeView state
  switch (activeView) {
    case 'factors':
      return renderFactorsView();
    case 'timeline':
      return renderTimelineView();
    case 'trends':
      return renderTrendsView();
    case 'score':
    default:
      return renderScoreView();
  }
};

export default PredictionVisualization;