// Part 1: Imports and Initial Setup
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  Users, 
  Bookmark, 
  ListTodo, 
  Link2, 
  LogOut,
  ChevronDown,
  BookmarkCheck,
  ArrowDownUp,
  Grid,
  List  // Added for view toggle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Component imports
import ClientCard from './components/ClientCard';
import TableView from './components/TableView'; // Import new TableView component
import NewClientModal from './components/NewClientModal';
import Alert from './components/Alert';
import TaskPanel from './components/TaskPanel';
import BookmarkPanel from './components/BookmarkPanel';
import DateFilter from './components/DateFilter';
import { getClientStatus, calculateMetrics } from './utils/statusUtils';
import { STATUS_CONFIG } from './utils/statusUtils';
import IntelligenceModal from './components/intelligence/IntelligenceModal';
import RiskFactors from './components/predictions/RiskFactors';
import FeedbackForm from './components/predictions/FeedbackForm';
import { calculateProbabilityTrend, extractDealFactors } from './utils/predictionUtils';

// Auth-related imports
import LoginPage from './components/auth/LoginPage';
import { useAuth } from './hooks/useAuth';
import UserManagement from './components/admin/UserManagement';
import FlightTracker from './components/FlightTracker';

// Constants
const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';
const CLIENTS_PER_PAGE = 30;
const RECENT_CLIENTS_COUNT = 5;


// Priority options - Removed BOOKMARKED as requested
const PRIORITY_OPTIONS = {
  RECENT: 'recent',
  DEAL_VALUE: 'dealValue',
  FOLLOW_UP: 'followUp',
  BALANCED: 'balanced'
};

// Priority labels - Removed BOOKMARKED as requested
const PRIORITY_LABELS = {
  [PRIORITY_OPTIONS.RECENT]: 'Recent Clients',
  [PRIORITY_OPTIONS.DEAL_VALUE]: 'Deal Value',
  [PRIORITY_OPTIONS.FOLLOW_UP]: 'Follow-up Needed',
  [PRIORITY_OPTIONS.BALANCED]: 'Smart Balance'
};

// View mode constants
const VIEW_MODES = {
  CARD: 'card',
  TABLE: 'table'
};

// Client filtering helper function - Fixed to properly handle 'active' status
const getFilteredClients = (clients, searchTerm, selectedStatus) => {
  return clients.filter(client => {
    // Search filter
    const searchFilter = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      (client.name?.toLowerCase() || '').includes(searchFilter) ||
      (client.company?.toLowerCase() || '').includes(searchFilter);

    // Status filter - Compare with the actual isActive property for 'active' status
    let statusMatch = false;
    if (selectedStatus === 'all') {
      statusMatch = true;
    } else if (selectedStatus === 'active') {
      statusMatch = client.isActive === true;
    } else {
      statusMatch = getClientStatus(client) === selectedStatus;
    }

    // Return true only if both conditions are met
    return matchesSearch && statusMatch;
  });
};

// Client priority scoring function
const calculateClientScore = (client, priorityType) => {
  let score = 0;
  const now = new Date();
  
  // Base score components that apply to all priority types
  
  // Recent clients get a base score
  if (client.isRecent) {
    score += 10;
  }
  
  // Last contact recency (more recent = higher score)
  if (client.lastContact) {
    const lastContactDate = new Date(client.lastContact);
    const daysSinceContact = Math.floor((now - lastContactDate) / (1000 * 60 * 60 * 24));
    if (daysSinceContact < 7) {
      score += 5;
    } else if (daysSinceContact < 30) {
      score += 3;
    }
  }
  
  // Bookmarked status
  if (client.isBookmarked) {
    score += 8;
  }
  
  // Deal value (total pipeline)
  const totalPipeline = client.deals?.reduce((sum, deal) => 
    sum + (deal.status !== 'closed_lost' ? deal.value : 0), 0) || 0;
  
  if (totalPipeline > 500000) {
    score += 10;
  } else if (totalPipeline > 100000) {
    score += 8;
  } else if (totalPipeline > 50000) {
    score += 5;
  } else if (totalPipeline > 10000) {
    score += 3;
  }
  
  // Follow-up needed (future follow-up date)
  if (client.followUpDate) {
    const followUpDate = new Date(client.followUpDate);
    if (followUpDate > now) {
      const daysToFollowUp = Math.floor((followUpDate - now) / (1000 * 60 * 60 * 24));
      if (daysToFollowUp < 3) {
        score += 15; // Imminent follow-ups
      } else if (daysToFollowUp < 7) {
        score += 10; // Near-term follow-ups
      }
    }
  }
  
  // Active deals in negotiation/proposal stage
  const hasHotDeals = client.deals?.some(deal => 
    deal.status === 'negotiation' || deal.status === 'proposal'
  );
  if (hasHotDeals) {
    score += 7;
  }
  
  // Apply priority-type specific weights
  switch (priorityType) {
    case PRIORITY_OPTIONS.RECENT:
      // Heavily weight recency
      if (client.isRecent) {
        score *= 3;
      }
      break;
      
    case PRIORITY_OPTIONS.DEAL_VALUE:
      // Heavily weight deal value
      if (totalPipeline > 0) {
        score = score + (Math.log10(totalPipeline) * 5);
      }
      break;
      
    case PRIORITY_OPTIONS.FOLLOW_UP:
      // Heavily weight follow-up dates
      if (client.followUpDate) {
        const followUpDate = new Date(client.followUpDate);
        if (followUpDate > now) {
          score *= 2;
        }
      }
      break;
      
    case PRIORITY_OPTIONS.BALANCED:
      // Balanced scoring already applied by default
      break;
      
    default:
      // Balanced scoring already applied by default
      break;
  }
  
  return score;
};

/// Update the existing function - around line 228
const handleFeedbackSubmit = async (feedback) => {
  try {
    // Add client ID and user ID from the context
    const enhancedFeedback = {
      ...feedback,
      userId: user.id,
      clientId: feedbackTarget?.clientId
    };
    
    await axios.post(`${API_URL}/feedback`, enhancedFeedback);
    setShowFeedbackForm(false);
    showAlert('success', 'Thank you for your feedback!');
  } catch (error) {
    showAlert('error', 'Failed to submit feedback. Please try again.');
    console.error('Feedback submission error:', error);
  }
};

// Part 4: Add a handler to open the feedback form
const handleOpenFeedback = (targetItem) => {
  setFeedbackTarget(targetItem);
  setShowFeedbackForm(true);
};

// Sort clients by priority score
const sortClientsByPriority = (clients, priorityType) => {
  return [...clients].sort((a, b) => {
    const scoreA = calculateClientScore(a, priorityType);
    const scoreB = calculateClientScore(b, priorityType);
    return scoreB - scoreA; // Higher score first
  });
};

// PrivateRoute Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Part 2: Dashboard Component Core
const Dashboard = () => {
  const queryClient = useQueryClient();
  const { logout, user } = useAuth();

  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(true);
  const [isBookmarkPanelOpen, setIsBookmarkPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRecentClients, setShowRecentClients] = useState(false);
  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false);
  const [selectedIntelligenceClient, setSelectedIntelligenceClient] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  
  // New state for view mode with localStorage persistence
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem('clientViewMode');
    return savedViewMode && Object.values(VIEW_MODES).includes(savedViewMode) 
      ? savedViewMode 
      : VIEW_MODES.CARD;
  });
  
  // New state for priority preference
  const [priorityPreference, setPriorityPreference] = useState(() => {
    const savedPreference = localStorage.getItem('clientPriorityPreference');
    return savedPreference || PRIORITY_OPTIONS.BALANCED;
  });

  // Save priority preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('clientPriorityPreference', priorityPreference);
  }, [priorityPreference]);
  
  // Save view mode preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('clientViewMode', viewMode);
  }, [viewMode]);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState(() => ({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
  }));

  // Intelligence Modal Handler
  const handleShowIntelligence = (clientId, userId, clientName) => {
    setSelectedIntelligenceClient({ _id: clientId, userId, name: clientName });
    setShowIntelligenceModal(true);
  };

  // Recent Clients Query - Updated to include dateFilter
  const { data: recentClients = [] } = useQuery({
    queryKey: ['clients', 'recent', dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        recent: 'true', 
        limit: RECENT_CLIENTS_COUNT,
        startDate: dateFilter.start,
        endDate: dateFilter.end
      });
      const { data } = await axios.get(`${API_URL}/clients?${params}`);
      return data.clients;
    }
  });

  // Paginated Clients Query - Updated to include dateFilter
  const { data: paginatedData = { clients: [], totalPages: 0 }, isLoading, error } = useQuery({
    queryKey: ['clients', 'paginated', currentPage, showBookmarked, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: CLIENTS_PER_PAGE,
        excludeRecent: 'true',
        startDate: dateFilter.start,
        endDate: dateFilter.end
      });
      if (showBookmarked) params.append('bookmarked', 'true');
      
      const { data } = await axios.get(`${API_URL}/clients?${params}`);
      return data;
    }
  });

  // Stats Query
  const { data: stats = {} } = useQuery({
    queryKey: ['stats', dateFilter],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/stats`, {
        params: {
          startDate: dateFilter.start,
          endDate: dateFilter.end
        }
      });
      return data;
    }
  });

  // Display clients logic - updated to include priority sorting
  const displayClients = () => {
    // First filter recent clients
    let filteredRecentClients = showRecentClients 
      ? getFilteredClients(recentClients, searchTerm, selectedStatus)
      : [];

    // Then filter paginated clients
    let filteredPaginatedClients = getFilteredClients(paginatedData.clients, searchTerm, selectedStatus);

    // Apply priority sorting to both sets of clients
    filteredRecentClients = sortClientsByPriority(filteredRecentClients, priorityPreference);
    filteredPaginatedClients = sortClientsByPriority(filteredPaginatedClients, priorityPreference);

    return {
      recentClients: filteredRecentClients,
      paginatedClients: filteredPaginatedClients,
      hasResults: filteredRecentClients.length > 0 || filteredPaginatedClients.length > 0
    };
  };

  // Create Client Mutation
  const createClientMutation = useMutation({
    mutationFn: async (newClient) => {
      const response = await axios.post(`${API_URL}/clients`, newClient);
      return response.data;
    },
    onSuccess: (data) => {
      // More aggressive invalidation of all client-related queries
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['stats']);
      
      // Force reset to page 1
      setCurrentPage(1);
      
      // Optional: Add a small delay before showing success message
      // to give time for queries to refetch
      setTimeout(() => {
        showAlert('success', 'New client added successfully');
      }, 100);
    },
    onError: (error) => {
      showAlert('error', error.response?.data?.message || 'Error creating client');
    }
  });

  // Update Client Mutation
  const updateClientMutation = useMutation({
    mutationFn: (client) => axios.put(`${API_URL}/clients/${client._id}`, client),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['stats']);
      showAlert('success', 'Client updated successfully');
    },
    onError: (error) => {
      showAlert('error', error.response?.data?.message || 'Error updating client');
    }
  });

  // Bookmark Mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (clientId) => {
      const response = await axios.patch(`${API_URL}/clients/${clientId}/bookmark`);
      return response.data;
    },
    onSuccess: (data, clientId) => {
      queryClient.invalidateQueries(['clients']);
      showAlert('success', `Client ${data.isBookmarked ? 'bookmarked' : 'unbookmarked'} successfully`);
    },
    onError: (error) => {
      showAlert('error', error.response?.data?.message || 'Error toggling bookmark');
    }
  });

  // Alert Handler
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const { data: dealStats = {} } = useQuery({
	  queryKey: ['dealStats', dateFilter],
	  queryFn: async () => {
		const { data } = await axios.get(`${API_URL}/deals/stats`, {
		  params: {
			startDate: dateFilter.start,
			endDate: dateFilter.end
		  }
		});
		return data;
	  }
	});
  // Handler Functions
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowNewClientModal(true);
  };

  const handleSaveClient = async (clientData) => {
    if (selectedClient) {
      await updateClientMutation.mutateAsync({ ...clientData, _id: selectedClient._id });
    } else {
      await createClientMutation.mutateAsync(clientData);
    }
    setSelectedClient(null);
    setShowNewClientModal(false);
  };

  const handleToggleBookmark = async (clientId) => {
    if (!clientId) {
      showAlert('error', 'Unable to update bookmark');
      return;
    }
    await toggleBookmarkMutation.mutateAsync(clientId);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  
  // Handle priority preference change
  const handlePriorityChange = (e) => {
    setPriorityPreference(e.target.value);
  };
  
  // Handle view mode toggle
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Effect to refresh queries when dateFilter changes
  useEffect(() => {
    queryClient.invalidateQueries(['clients']);
    queryClient.invalidateQueries(['stats']);
  }, [dateFilter, queryClient]);

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading data</h2>
          <p className="text-gray-600">{error.response?.data?.message || 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  const { recentClients: filteredRecentClients, paginatedClients: filteredPaginatedClients, hasResults } = displayClients();
  const showEmptyState = !isLoading && !hasResults;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <BookmarkPanel 
        isOpen={isBookmarkPanelOpen} 
        onToggle={() => setIsBookmarkPanelOpen(!isBookmarkPanelOpen)} 
      />

      <div className={`flex-1 flex flex-col main-content ${isTaskPanelOpen ? 'task-panel-open' : ''}`}>
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Header Section */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsBookmarkPanelOpen(!isBookmarkPanelOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Toggle Bookmarks"
                >
                  <Link2 size={20} className="text-gray-500" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900">SalesSynth</h1>
                <DateFilter onFilterChange={setDateFilter} />
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-sm">
                  <div className="text-gray-500">Total Pipeline</div>
                  <div className="text-xl font-bold">${stats.pipelineValue?.toLocaleString() || 0}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Total Closed</div>
                  <div className="text-xl font-bold text-green-600">${stats.closedValue?.toLocaleString() || 0}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Active Clients</div>
                  <div className="text-xl font-bold text-green-600">{stats.activeClients || 0}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Bookmarked</div>
                  <div className="text-xl font-bold">{stats.bookmarkedClients || 0}</div>
                </div>
                <button
                  onClick={() => setIsTaskPanelOpen(!isTaskPanelOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Toggle Tasks"
                >
                  <ListTodo size={20} className="text-gray-500" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg text-red-500"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
          {/* Search and Filters Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clients by name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              {/* View Toggle Buttons */}
              <div className="bg-gray-100 p-1 rounded-lg flex">
                <button
                  onClick={() => handleViewModeChange(VIEW_MODES.CARD)}
                  className={`p-2 rounded ${viewMode === VIEW_MODES.CARD 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}`}
                  title="Card View"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => handleViewModeChange(VIEW_MODES.TABLE)}
                  className={`p-2 rounded ${viewMode === VIEW_MODES.TABLE 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}`}
                  title="Table View"
                >
                  <List size={18} />
                </button>
              </div>
              
              {/* Priority Dropdown */}
              <div className="relative flex items-center">
                <ArrowDownUp size={18} className="text-gray-500 mr-2" />
                <select
                  value={priorityPreference}
                  onChange={handlePriorityChange}
                  className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200"
                  title="Prioritize clients by"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setShowBookmarked(!showBookmarked)}
                className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
                  showBookmarked 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                {showBookmarked ? (
                  <BookmarkCheck size={20} className="mr-2 text-blue-600" />
                ) : (
                  <Bookmark size={20} className="mr-2 text-gray-500" />
                )}
                {showBookmarked ? 'Show All' : 'Show Bookmarked'}
              </button>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setShowNewClientModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors duration-200"
              >
                <UserPlus size={20} className="mr-2" />
                Add Client
              </button>
            </div>
          </div>

          {/* Client Display Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : showEmptyState ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm p-8">
              {searchTerm ? (
                <>
                  <Users size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No matching clients found</h3>
                  <p className="text-gray-500 mb-4 text-center">
                    Try adjusting your search or filters to find what you're looking for
                  </p>
                </>
              ) : (
                <>
                  <Users size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to SalesSynth</h3>
                  <p className="text-gray-500 mb-4 text-center">
                    Track your fintech sales pipeline and client relationships in one place.
                  </p>
                  <button 
                    onClick={() => setShowNewClientModal(true)} 
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add Your First Client
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Recent Clients Section */}
              {filteredRecentClients.length > 0 && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
                    <button
                      onClick={() => setShowRecentClients(!showRecentClients)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {showRecentClients ? 'Hide Recent' : 'Show Recent'}
                    </button>
                  </div>
                  {showRecentClients && (
                    <div className="mb-8">
                      {viewMode === VIEW_MODES.CARD ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredRecentClients.map(client => (
                            <ClientCard 
                              key={client._id} 
                              client={client} 
                              onEdit={handleEditClient}
                              onToggleBookmark={handleToggleBookmark}
                              onShowIntelligence={handleShowIntelligence}
                            />
                          ))}
                        </div>
                      ) : (
                        <TableView 
                          clients={filteredRecentClients} 
                          onEdit={handleEditClient}
                          onToggleBookmark={handleToggleBookmark}
                          onShowIntelligence={handleShowIntelligence}
                        />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Paginated Clients Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {searchTerm ? 'Search Results' : 'All Clients'}
                </h2>
                {viewMode === VIEW_MODES.CARD ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPaginatedClients.map(client => (
                      <ClientCard 
                        key={client._id} 
                        client={client} 
                        onEdit={handleEditClient}
                        onToggleBookmark={handleToggleBookmark}
                        onShowIntelligence={handleShowIntelligence}
                      />
                    ))}
                  </div>
                ) : (
                  <TableView 
                    clients={filteredPaginatedClients} 
                    onEdit={handleEditClient}
                    onToggleBookmark={handleToggleBookmark}
                    onShowIntelligence={handleShowIntelligence}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <TaskPanel 
        isOpen={isTaskPanelOpen} 
        onToggle={() => setIsTaskPanelOpen(!isTaskPanelOpen)} 
      />

      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => {
          setShowNewClientModal(false);
          setSelectedClient(null);
        }}
        onSave={handleSaveClient}
        client={selectedClient}
      />

		<IntelligenceModal 
		  isOpen={showIntelligenceModal}
		  onClose={() => {
			setShowIntelligenceModal(false);
			setSelectedIntelligenceClient(null);
		  }}
		  clientId={selectedIntelligenceClient?._id}
		  userId={selectedIntelligenceClient?.userId}
		  clientName={selectedIntelligenceClient?.name}
		  onFeedback={handleOpenFeedback}
		/>
		
		{showFeedbackForm && (
		  <FeedbackForm
			itemId={feedbackTarget?.id}
			itemType={feedbackTarget?.type || 'prediction'}
			onSubmit={handleFeedbackSubmit}
			onCancel={() => setShowFeedbackForm(false)}
			initialValues={{}}
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		  />
		)}
    </div>
  );
};

// Main App Component with Routing
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;