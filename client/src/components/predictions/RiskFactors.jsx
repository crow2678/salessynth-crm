// src/components/predictions/RiskFactors.jsx
import React from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  TrendingDown, 
  Users, 
  Clock, 
  DollarSign, 
  FileText, 
  MessageSquare,
  Flag,
  ShieldAlert,
  Target,
  PieChart,
  Info,
  Zap,
  XCircle
} from 'lucide-react';

/**
 * Risk Factors Component
 * 
 * Displays the negative factors that potentially hinder deal success
 * 
 * @param {Object} props - Component props
 * @param {Array} props.factors - Array of factor strings or objects
 * @param {Object} props.data - Optional additional data for context
 * @param {string} props.type - Display type ('list', 'cards', or 'impact')
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onFactorClick - Optional callback when a factor is clicked
 */
const RiskFactors = ({ 
  factors = [], 
  data = {}, 
  type = 'list',
  className = '',
  onFactorClick = null
}) => {
  // If no factors provided, return empty state
  if (!factors || factors.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-6">
          <ShieldAlert className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Risk Factors</h3>
          <p className="text-sm text-gray-500">
            No risk factors have been identified yet. This could be a positive sign, 
            but more data may reveal potential challenges.
          </p>
        </div>
      </div>
    );
  }

  // Normalize factors data
  const normalizedFactors = factors.map(factor => {
    if (typeof factor === 'string') {
      return {
        description: factor,
        severity: 1,
        type: determineFactorType(factor)
      };
    }
    return {
      ...factor,
      type: factor.type || determineFactorType(factor.description)
    };
  });

  // Group factors by type if needed
  const groupedFactors = normalizedFactors.reduce((acc, factor) => {
    if (!acc[factor.type]) {
      acc[factor.type] = [];
    }
    acc[factor.type].push(factor);
    return acc;
  }, {});

  // Function to determine factor type based on content
  function determineFactorType(description) {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('engage') || lowerDesc.includes('meeting') || lowerDesc.includes('call') || lowerDesc.includes('contact') || lowerDesc.includes('response')) {
      return 'engagement';
    }
    if (lowerDesc.includes('budget') || lowerDesc.includes('price') || lowerDesc.includes('cost') || lowerDesc.includes('revenue') || lowerDesc.includes('roi') || lowerDesc.includes('fund')) {
      return 'financial';
    }
    if (lowerDesc.includes('timeline') || lowerDesc.includes('schedule') || lowerDesc.includes('date') || lowerDesc.includes('delay')) {
      return 'timeline';
    }
    if (lowerDesc.includes('stakeholder') || lowerDesc.includes('decision') || lowerDesc.includes('team') || lowerDesc.includes('approval')) {
      return 'stakeholders';
    }
    if (lowerDesc.includes('product') || lowerDesc.includes('feature') || lowerDesc.includes('solution') || lowerDesc.includes('technical') || lowerDesc.includes('requirement')) {
      return 'product';
    }
    if (lowerDesc.includes('competitor') || lowerDesc.includes('alternative') || lowerDesc.includes('market') || lowerDesc.includes('vs')) {
      return 'competitive';
    }
    return 'general';
  }

  // Get icon for factor type
  function getFactorIcon(type, className = 'h-5 w-5') {
    switch (type) {
      case 'engagement':
        return <MessageSquare className={className} />;
      case 'financial':
        return <DollarSign className={className} />;
      case 'timeline':
        return <Clock className={className} />;
      case 'stakeholders':
        return <Users className={className} />;
      case 'product':
        return <FileText className={className} />;
      case 'competitive':
        return <TrendingDown className={className} />;
      case 'general':
      default:
        return <AlertTriangle className={className} />;
    }
  }

  // Get color for factor type
  function getFactorColor(type) {
    switch (type) {
      case 'engagement':
        return 'text-purple-600 bg-purple-50';
      case 'financial':
        return 'text-red-600 bg-red-50';
      case 'timeline':
        return 'text-amber-600 bg-amber-50';
      case 'stakeholders':
        return 'text-indigo-600 bg-indigo-50';
      case 'product':
        return 'text-gray-600 bg-gray-50';
      case 'competitive':
        return 'text-orange-600 bg-orange-50';
      case 'general':
      default:
        return 'text-rose-600 bg-rose-50';
    }
  }

  // Render the list view
  const renderListView = () => (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <ShieldAlert className="mr-2 h-5 w-5 text-orange-500" />
        Risk Factors
      </h3>
      
      <ul className="space-y-3">
        {normalizedFactors.map((factor, index) => {
          const colorClass = getFactorColor(factor.type);
          const colorParts = colorClass.split(' ');
          const textColor = colorParts[0];
          
          return (
            <li 
              key={index} 
              className="flex items-start"
              onClick={() => onFactorClick && onFactorClick(factor)}
            >
              <div className={`rounded-full p-1 mr-3 mt-0.5 ${colorClass}`}>
                {getFactorIcon(factor.type, 'h-4 w-4')}
              </div>
              <span className="text-gray-700">{factor.description}</span>
              
              {factor.severity > 1 && (
                <div className="ml-auto flex items-center">
                  {[...Array(factor.severity)].map((_, i) => (
                    <AlertCircle key={i} className={`h-3.5 w-3.5 ${textColor}`} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  // Render the cards view
  const renderCardsView = () => (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <ShieldAlert className="mr-2 h-5 w-5 text-orange-500" />
        Risk Factors
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(groupedFactors).map(([type, typedFactors]) => (
          <div key={type} className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className={`rounded-full p-1.5 mr-2 ${getFactorColor(type)}`}>
                {getFactorIcon(type, 'h-4 w-4')}
              </div>
              <h4 className="font-medium text-gray-900 capitalize">
                {type === 'general' ? 'Other Concerns' : `${type} Concerns`}
              </h4>
              <div className="ml-auto bg-gray-100 text-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {typedFactors.length}
              </div>
            </div>
            
            <ul className="space-y-2">
              {typedFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start text-sm">
                  <XCircle className="h-3.5 w-3.5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{factor.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  // Render the impact view
  const renderImpactView = () => {
    // Sort factors by severity
    const sortedFactors = [...normalizedFactors].sort((a, b) => b.severity - a.severity);
    
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ShieldAlert className="mr-2 h-5 w-5 text-orange-500" />
          Key Risk Factors by Severity
        </h3>
        
        <div className="space-y-4">
          {sortedFactors.map((factor, index) => {
            const colorClass = getFactorColor(factor.type);
            const colorParts = colorClass.split(' ');
            const textColor = colorParts[0];
            const bgColor = colorParts[1];
            const borderColor = textColor.replace('text', 'border');
            
            // Calculate severity width (20% minimum, 100% maximum)
            const severityPercentage = 20 + (Math.min(factor.severity, 5) / 5) * 80;
            
            return (
              <div key={index} className="relative">
                <div className="flex items-center mb-1">
                  <div className={`${textColor} mr-2`}>
                    {getFactorIcon(factor.type, 'h-4 w-4')}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{factor.description}</span>
                </div>
                
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${bgColor} ${borderColor}`}
                    style={{ width: `${severityPercentage}%` }}
                  >
                    <div className="flex items-center justify-end h-full pr-3">
                      <span className="text-xs font-semibold">
                        {['Low', 'Medium', 'High', 'Very High', 'Critical'][Math.min(factor.severity - 1, 4)]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {data.riskScore && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-500">Overall Risk Score</div>
              <div className="font-semibold text-orange-600">{data.riskScore}%</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Return the appropriate view based on type
  switch (type) {
    case 'cards':
      return renderCardsView();
    case 'impact':
      return renderImpactView();
    case 'list':
    default:
      return renderListView();
  }
};

export default RiskFactors;