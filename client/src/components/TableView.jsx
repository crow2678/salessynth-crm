// TableView.jsx
import React, { useState } from 'react';
import { 
  Calendar, 
  Phone, 
  Mail, 
  DollarSign, 
  AlertCircle, 
  Bookmark, 
  BookmarkCheck, 
  Edit,
  Flame,
  CircleDollarSign,
  Clock,
  Snowflake,
  TrendingDown,
  Star,
  Rocket,
  ChevronUp,
  ChevronDown,
  CheckCircle  
} from 'lucide-react';
import { STATUS_CONFIG, getClientStatus, getDealStatus } from '../utils/statusUtils';

const TableView = ({ 
  clients, 
  onEdit, 
  onToggleBookmark, 
  onShowIntelligence 
}) => {
  // State for sorting
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Helper Functions
  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Date formatting error:', e);
      return '';
    }
  };

  const isFutureDate = (dateValue) => {
    if (!dateValue) return false;
    try {
      const date = new Date(dateValue);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return date > new Date();
    } catch (e) {
      return false;
    }
  };

  // Calculate total pipeline for a client
  const calculatePipeline = (client) => {
    return client.deals?.reduce((sum, deal) => 
      sum + (deal.status !== 'closed_lost' ? deal.value : 0), 0) || 0;
  };

  // Get status icon for a client
  const getDealStatusIcon = (client) => {
    // If no deals, return null
    if (!client.deals || client.deals.length === 0) {
      return { icon: null, tooltip: 'No Deals' };
    }

    // Prioritize recent status
    if (client.isRecent) {
      return {
        icon: <Star className="h-5 w-5 text-blue-500" />,
        tooltip: 'Recent Client'
      };
    }

    // Check for lost deals
    const hasLostDeals = client.deals.some(deal => deal.status === 'closed_lost');
    if (hasLostDeals && client.deals.every(deal => deal.status === 'closed_lost')) {
      return { 
        icon: <TrendingDown className="h-5 w-5 text-red-500" />, 
        tooltip: 'Lost Deals' 
      };
    }

    // Check for active negotiations
    const hasHotDeals = client.deals.some(deal => 
      deal.status === 'negotiation' || deal.status === 'proposal'
    );
    if (hasHotDeals) {
      return { 
        icon: <Flame className="h-5 w-5 text-orange-500" />, 
        tooltip: 'Hot Deals' 
      };
    }

    // Check for active deals
    const hasActiveDeals = client.deals.some(deal => 
      ['prospecting', 'qualified'].includes(deal.status)
    );
    if (hasActiveDeals) {
      return { 
        icon: <CircleDollarSign className="h-5 w-5 text-green-500" />, 
        tooltip: 'Active Deals' 
      };
    }

  // Check for won deals - handle any case format variations
  const hasWonDeals = client.deals.some(deal => {
    const status = String(deal.status || '').toLowerCase();
    return status.includes('closed') && status.includes('won');
  });
  
  if (hasWonDeals) {
    return { 
      icon: <CheckCircle className="h-5 w-5 text-green-500" />, 
      tooltip: 'Closed Won' 
    };
  }

    // Check for stalled deals
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const hasInactiveDeal = client.deals.some(deal => 
      new Date(deal.lastUpdated) < thirtyDaysAgo
    );
    
    if (hasInactiveDeal) {
      return { 
        icon: <Clock className="h-5 w-5 text-yellow-500" />, 
        tooltip: 'Stalled Deals' 
      };
    }

    // Default to inactive
    return { 
      icon: <Snowflake className="h-5 w-5 text-blue-500" />, 
      tooltip: 'Inactive' 
    };
  };

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset direction to asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting to clients
  const sortedClients = [...clients].sort((a, b) => {
    let valueA, valueB;
    
    // Extract the right field values based on sortField
    switch (sortField) {
      case 'name':
        valueA = a.name?.toLowerCase() || '';
        valueB = b.name?.toLowerCase() || '';
        break;
      case 'company':
        valueA = a.company?.toLowerCase() || '';
        valueB = b.company?.toLowerCase() || '';
        break;
      case 'status':
        valueA = getClientStatus(a);
        valueB = getClientStatus(b);
        break;
      case 'pipeline':
        valueA = calculatePipeline(a);
        valueB = calculatePipeline(b);
        break;
      case 'lastContact':
        valueA = a.lastContact ? new Date(a.lastContact).getTime() : 0;
        valueB = b.lastContact ? new Date(b.lastContact).getTime() : 0;
        break;
      default:
        valueA = a.name?.toLowerCase() || '';
        valueB = b.name?.toLowerCase() || '';
    }

    // Compare values based on direction
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  // Event handlers
  const handleEditClick = (e, client) => {
    e.stopPropagation();
    onEdit(client);
  };

  const handleBookmarkClick = (e, clientId) => {
    e.stopPropagation();
    onToggleBookmark(clientId);
  };

  const handleIntelligenceClick = (e, client) => {
    e.stopPropagation();
    
    if (!client._id || !client.userId) {
      console.error("Missing clientId or userId. Cannot open IntelligenceModal.");
      return;
    }
    
    onShowIntelligence(client._id, client.userId, client.name);
  };

  // Render sort icon based on current sort state
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <div className="w-4" />;
    }
    
    return sortDirection === 'asc' ? (
      <ChevronUp size={16} className="ml-1" />
    ) : (
      <ChevronDown size={16} className="ml-1" />
    );
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th 
              className="p-3 text-left text-sm font-medium cursor-pointer"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Client
                {renderSortIcon('name')}
              </div>
            </th>
            <th 
              className="p-3 text-left text-sm font-medium cursor-pointer"
              onClick={() => handleSort('company')}
            >
              <div className="flex items-center">
                Company
                {renderSortIcon('company')}
              </div>
            </th>
            <th 
              className="p-3 text-left text-sm font-medium cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                {renderSortIcon('status')}
              </div>
            </th>
            <th 
              className="p-3 text-left text-sm font-medium cursor-pointer"
              onClick={() => handleSort('pipeline')}
            >
              <div className="flex items-center">
                Pipeline
                {renderSortIcon('pipeline')}
              </div>
            </th>
            <th 
              className="p-3 text-left text-sm font-medium cursor-pointer"
              onClick={() => handleSort('lastContact')}
            >
              <div className="flex items-center">
                Last Contact
                {renderSortIcon('lastContact')}
              </div>
            </th>
            <th className="p-3 text-left text-sm font-medium">
              Deals
            </th>
            <th className="p-3 text-left text-sm font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedClients.map(client => {
            const status = getClientStatus(client);
            const statusConfig = STATUS_CONFIG[status];
            const pipeline = calculatePipeline(client);
            const { icon: statusIcon, tooltip: statusTooltip } = getDealStatusIcon(client);
            const activeDeals = client.deals?.filter(deal => deal.status !== 'closed_lost') || [];
            
            return (
              <tr 
                key={client._id}
                className={`hover:bg-gray-50 ${client.isRecent ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
              >
                {/* Client Name */}
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {statusIcon && (
                        <div title={statusTooltip}>
                          {statusIcon}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      {client.isRecent && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* Company */}
                <td className="p-3">
                  <span className="text-gray-500">{client.company || 'No Company'}</span>
                </td>
                
                {/* Status */}
                <td className="p-3">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusConfig.classes.replace('border-l-4', '').replace('border-', 'bg-').replace('500', '100')
                    }`}
                  >
                    {statusConfig.label}
                  </span>
                </td>
                
                {/* Pipeline */}
                <td className="p-3">
                  <span className={pipeline > 0 ? 'font-medium text-green-600' : 'text-gray-500'}>
                    ${pipeline.toLocaleString()}
                  </span>
                </td>
                
                {/* Last Contact */}
                <td className="p-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>
                      {client.lastContact 
                        ? formatDate(client.lastContact)
                        : 'Not contacted'}
                    </span>
                  </div>
                </td>
                
                {/* Deals */}
                <td className="p-3">
                  {activeDeals.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {activeDeals.slice(0, 2).map((deal, index) => {
                        const dealStatus = getDealStatus(deal);
                        return (
                          <span 
                            key={index}
                            className={`px-2 py-0.5 rounded-full text-xs ${dealStatus.color} border border-current`}
                            title={`${deal.title}: $${deal.value.toLocaleString()}`}
                          >
                            {deal.title.length > 10 ? deal.title.substring(0, 10) + '...' : deal.title}
                          </span>
                        );
                      })}
                      {activeDeals.length > 2 && (
                        <span className="px-2 py-0.5 rounded-full text-xs text-gray-500 border border-gray-300">
                          +{activeDeals.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No active deals</span>
                  )}
                </td>
                
                {/* Actions */}
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleIntelligenceClick(e, client)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                      title="View Intelligence Report"
                    >
                      <Rocket className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleBookmarkClick(e, client._id)}
                      className={`p-1 rounded-full ${
                        client.isBookmarked ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={client.isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                    >
                      {client.isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleEditClick(e, client)}
                      className="p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-500 rounded-full"
                      title="Edit client"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {clients.length === 0 && (
        <div className="text-center py-12 bg-white">
          <p className="text-gray-500">No clients found</p>
        </div>
      )}
    </div>
  );
};

export default TableView;