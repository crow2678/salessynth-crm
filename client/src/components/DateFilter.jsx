import React, { useState } from 'react';
import { Calendar, Filter, ChevronDown } from 'lucide-react';

const DateFilter = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState('currentYear');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getCurrentYear = () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
    };
  };

  const getLast12Months = () => {
    const now = new Date();
    return {
      start: new Date(now.setMonth(now.getMonth() - 12)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };
  };

  const getYTD = () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };
  };

  const handleFilterSelect = (type) => {
    setFilterType(type);
    let dateRange;

    switch (type) {
      case 'currentYear':
        dateRange = getCurrentYear();
        break;
      case 'last12Months':
        dateRange = getLast12Months();
        break;
      case 'ytd':
        dateRange = getYTD();
        break;
      case 'custom':
        setShowDatePicker(true);
        return;
      default:
        dateRange = getCurrentYear();
    }

    onFilterChange(dateRange);
    setIsOpen(false);
  };

  const handleCustomDateSubmit = () => {
    if (customRange.start && customRange.end) {
      onFilterChange(customRange);
      setShowDatePicker(false);
      setIsOpen(false);
    }
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'currentYear':
        return new Date().getFullYear().toString();
      case 'last12Months':
        return 'Last 12 Months';
      case 'ytd':
        return 'Year to Date';
      case 'custom':
        return `${customRange.start} - ${customRange.end}`;
      default:
        return 'Select Period';
    }
  };

  return (
    <div className="relative">
      <button
		  onClick={() => setIsOpen(!isOpen)}
		  className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border hover:bg-gray-50"
		>
		  <Calendar size={18} className="text-gray-600" />
		  <span className="text-sm font-medium">{getFilterLabel()}</span>
		  <ChevronDown size={16} className="text-gray-400" />
		</button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
          <div className="py-1">
            <button
              onClick={() => handleFilterSelect('currentYear')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Current Year
            </button>
            <button
              onClick={() => handleFilterSelect('last12Months')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Last 12 Months
            </button>
            <button
              onClick={() => handleFilterSelect('ytd')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Year to Date
            </button>
            <button
              onClick={() => handleFilterSelect('custom')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Custom Range
            </button>
          </div>
        </div>
      )}

      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium mb-4">Select Date Range</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomDateSubmit}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!customRange.start || !customRange.end}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;