// Part 1: Imports and Setup
import React from 'react';
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
  CheckCircle  // Added for closed won deals
} from 'lucide-react';
import { STATUS_CONFIG, getClientStatus, getDealStatus } from '../utils/statusUtils';

const ClientCard = ({ client, onEdit, onToggleBookmark, onShowIntelligence }) => {
  const status = getClientStatus(client);
  const statusConfig = STATUS_CONFIG[status];
  const totalPipeline = client.deals?.reduce((sum, deal) => 
    sum + (deal.status !== 'closed_lost' ? deal.value : 0), 0) || 0;

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
  // Status and Event Handlers
  const getDealStatusIcon = () => {
	  console.log("Deal statuses:", client.deals.map(deal => ({
		  status: deal.status,
		  title: deal.title,
		  lastUpdated: deal.lastUpdated
		})));
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

    // Check for won deals (NEW CODE)

	const hasWonDeals = client.deals.some(deal => 
	  deal.status === 'closed_won' || deal.status === 'Closed Won'
	);
	if (hasWonDeals) {
	  return { 
		icon: <CheckCircle className="h-5 w-5 text-green-500" />, 
		tooltip: 'Closed Won' 
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

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    onToggleBookmark(client._id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(client);
  };

  const handleIntelligenceClick = (e) => {  
    e.stopPropagation();

    console.log("🚀 Handling Intelligence Click:");
    console.log("Client ID:", client?._id);
    console.log("User ID:", client?.userId);  // ✅ Debugging userId before passing it

    if (!client._id || !client.userId) {
      console.error("🚨 Missing clientId or userId. Cannot open IntelligenceModal.");
      return;
    }

    onShowIntelligence(client._id, client.userId, client.name);
  };


  const { icon: statusIcon, tooltip: statusTooltip } = getDealStatusIcon();

  return (
    <div className={`relative p-4 rounded-lg shadow-md border-l-4 
      ${client.isRecent ? 'border-t-2 border-t-blue-500' : ''} 
      ${statusConfig.classes} 
      hover:shadow-lg transition-shadow`}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{client.name}</h3>
            {statusIcon && (
              <div title={statusTooltip} className="flex-shrink-0">
                {statusIcon}
              </div>
            )}
            {client.isRecent && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                New
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">{client.company || 'No Company'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleIntelligenceClick}
            className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 transition-all group"
            title="View Intelligence Report"
          >
            <div className="relative">
              <Rocket className="icon w-5 h-5 text-red-500 drop-shadow-lg transition-transform duration-300" />
            </div>
            <style jsx>{`
              /* When the button (with class 'group') is hovered, animate the .icon */
              .group:hover .icon {
                animation: pulse-scale 1.5s ease-in-out infinite;
              }
              @keyframes pulse-scale {
                0%, 100% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.2);
                }
              }
            `}</style>
          </button>
          <button
            onClick={handleBookmarkClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              client.isBookmarked 
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                : 'text-gray-400 hover:bg-gray-100 hover:text-blue-600'
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
            onClick={handleEditClick}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-all"
            title="Edit client"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        {client.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate" title={client.email}>{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
            <span title={client.phone}>{client.phone}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>
            {client.lastContact 
              ? `Last Contact: ${formatDate(client.lastContact)}`
              : 'Not contacted yet'}
          </span>
        </div>
        {totalPipeline > 0 && (
          <div className="flex items-center text-sm text-green-600 font-medium">
            <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Pipeline: ${totalPipeline.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Deals Section */}
      {client.deals && client.deals.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            Active Deals
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
              {client.deals.length}
            </span>
          </h4>
          <div className="space-y-2">
            {client.deals.map((deal, index) => {
              const dealStatus = getDealStatus(deal);
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span 
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        dealStatus.color.replace('text-', 'bg-')
                      }`} 
                    />
                    <span className="truncate" title={deal.title}>{deal.title}</span>
                  </div>
                  <span className={`${dealStatus.color} font-medium ml-2 flex-shrink-0`}>
                    ${deal.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Follow-up Alert */}
      {client.followUpDate && isFutureDate(client.followUpDate) && (
        <div className="mt-3 flex items-center text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Follow up on {formatDate(client.followUpDate)}</span>
        </div>
      )}

      {/* Notes Section */}
      {client.notes && (
        <div className="mt-3 text-sm text-gray-600 border-t pt-3">
          <div className="line-clamp-3" title={client.notes}>
            {client.notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientCard;