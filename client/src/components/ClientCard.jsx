import React from 'react';
import { Calendar, Phone, Mail, DollarSign, AlertCircle, Bookmark, BookmarkCheck, Edit } from 'lucide-react';
import { STATUS_CONFIG, getClientStatus, getDealStatus } from '../utils/statusUtils';

const ClientCard = ({ client, onEdit, onToggleBookmark }) => {
  const status = getClientStatus(client);
  const statusConfig = STATUS_CONFIG[status];
  const totalPipeline = client.deals?.reduce((sum, deal) => 
    sum + (deal.status !== 'closed_lost' ? deal.value : 0), 0) || 0;

  // Helper function to format dates consistently
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Ensure consistent timezone handling by appending T00:00:00
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString();
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    onToggleBookmark(client._id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(client);
  };

  return (
    <div className={`relative p-4 rounded-lg shadow-md border-l-4 ${statusConfig.classes} hover:shadow-lg transition-shadow`}>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{client.name}</h3>
          <p className="text-sm text-gray-600 truncate">{client.company || 'No Company'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
      {client.followUpDate && new Date(client.followUpDate + 'T00:00:00') > new Date() && (
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