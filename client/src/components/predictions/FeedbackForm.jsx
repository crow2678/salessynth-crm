// src/components/predictions/FeedbackForm.jsx
import React, { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  AlertTriangle, 
  MessageSquare, 
  BarChart,
  Lightbulb,
  Send,
  X
} from 'lucide-react';

/**
 * Feedback Form Component
 * 
 * A form to collect user feedback on predictions and intelligence insights
 * 
 * @param {Object} props - Component props
 * @param {string} props.itemId - ID of the item being rated (prediction, intelligence report, etc.)
 * @param {string} props.itemType - Type of item being rated ('prediction', 'insight', 'report')
 * @param {Function} props.onSubmit - Callback function when feedback is submitted
 * @param {Function} props.onCancel - Callback function when feedback is cancelled
 * @param {Object} props.initialValues - Optional initial values for the form
 * @param {string} props.className - Additional CSS classes
 */
const FeedbackForm = ({ 
  itemId,
  itemType = 'prediction',
  onSubmit,
  onCancel,
  initialValues = {},
  className = ''
}) => {
  // Initialize form state
  const [feedback, setFeedback] = useState({
    rating: initialValues.rating || null,
    feedbackType: initialValues.feedbackType || 'accuracy',
    comments: initialValues.comments || '',
    itemId,
    itemType
  });
  
  // Options for feedback types based on item type
  const getFeedbackTypeOptions = () => {
    switch (itemType) {
      case 'prediction':
        return [
          { value: 'accuracy', label: 'Accuracy Feedback' },
          { value: 'factors', label: 'Factor Feedback' },
          { value: 'timeline', label: 'Timeline Feedback' },
          { value: 'general', label: 'General Feedback' }
        ];
      case 'insight':
        return [
          { value: 'relevance', label: 'Relevance Feedback' },
          { value: 'actionability', label: 'Actionability Feedback' },
          { value: 'accuracy', label: 'Accuracy Feedback' },
          { value: 'general', label: 'General Feedback' }
        ];
      case 'report':
        return [
          { value: 'completeness', label: 'Completeness Feedback' },
          { value: 'usefulness', label: 'Usefulness Feedback' },
          { value: 'visual', label: 'Visual Feedback' },
          { value: 'general', label: 'General Feedback' }
        ];
      default:
        return [
          { value: 'general', label: 'General Feedback' },
          { value: 'feature', label: 'Feature Request' },
          { value: 'bug', label: 'Bug Report' }
        ];
    }
  };
  
  // Get title based on item type
  const getTitle = () => {
    switch (itemType) {
      case 'prediction':
        return 'Prediction Feedback';
      case 'insight':
        return 'Sales Intelligence Feedback';
      case 'report':
        return 'Report Feedback';
      default:
        return 'Feedback';
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (feedback.rating === null) {
      // Simple validation - could be expanded
      return;
    }
    
    // Call the onSubmit callback with the feedback data
    if (onSubmit) {
      onSubmit(feedback);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <MessageSquare className="mr-2 h-5 w-5 text-blue-500" />
          {getTitle()}
        </h3>
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Rating Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How accurate is this {itemType}?
          </label>
          
          <div className="flex items-center justify-center space-x-8">
            <button
              type="button"
              onClick={() => setFeedback({ ...feedback, rating: 'positive' })}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                feedback.rating === 'positive' 
                  ? 'bg-green-50 border-green-300 text-green-700' 
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <ThumbsUp className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Accurate</span>
            </button>
            
            <button
              type="button"
              onClick={() => setFeedback({ ...feedback, rating: 'neutral' })}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                feedback.rating === 'neutral' 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BarChart className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Partially Accurate</span>
            </button>
            
            <button
              type="button"
              onClick={() => setFeedback({ ...feedback, rating: 'negative' })}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                feedback.rating === 'negative' 
                  ? 'bg-red-50 border-red-300 text-red-700' 
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <ThumbsDown className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Inaccurate</span>
            </button>
          </div>
        </div>
        
        {/* Feedback Type */}
        <div className="mb-6">
          <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700 mb-2">
            Feedback Type
          </label>
          
          <select
            id="feedbackType"
            value={feedback.feedbackType}
            onChange={(e) => setFeedback({ ...feedback, feedbackType: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {getFeedbackTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Comments */}
        <div className="mb-6">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
            Comments
          </label>
          
          <textarea
            id="comments"
            value={feedback.comments}
            onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Please share your thoughts on what was helpful or could be improved..."
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={feedback.rating === null}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              feedback.rating === null
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Feedback
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;