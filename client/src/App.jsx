// Part 1: Imports and Initial Setup
import React, { useState } from 'react';
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
  BookmarkCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Component imports
import ClientCard from './components/ClientCard';
import NewClientModal from './components/NewClientModal';
import Alert from './components/Alert';
import TaskPanel from './components/TaskPanel';
import BookmarkPanel from './components/BookmarkPanel';
import DateFilter from './components/DateFilter';
import { getClientStatus, calculateMetrics } from './utils/statusUtils';
import { STATUS_CONFIG } from './utils/statusUtils';
import IntelligenceModal from './components/intelligence/IntelligenceModal';

// Auth-related imports
import LoginPage from './components/auth/LoginPage';
import { useAuth } from './hooks/useAuth';
import UserManagement from './components/admin/UserManagement';
import FlightTracker from './components/FlightTracker';

// Constants
const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';
const CLIENTS_PER_PAGE = 10;
const RECENT_CLIENTS_COUNT = 5;

// Client filtering helper function
const getFilteredClients = (clients, searchTerm, selectedStatus) => {
  return clients.filter(client => {
    // Search filter
    const searchFilter = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      (client.name?.toLowerCase() || '').includes(searchFilter) ||
      (client.company?.toLowerCase() || '').includes(searchFilter);

    // Status filter
    const matchesStatus = selectedStatus === 'all' || getClientStatus(client) === selectedStatus;

    // Return true only if both conditions are met
    return matchesSearch && matchesStatus;
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

  // Recent Clients Query
  const { data: recentClients = [] } = useQuery({
    queryKey: ['clients', 'recent'],
    queryFn: async () => {
      const params = new URLSearchParams({ recent: 'true', limit: RECENT_CLIENTS_COUNT });
      const { data } = await axios.get(`${API_URL}/clients?${params}`);
      return data.clients;
    }
  });

  // Paginated Clients Query
  const { data: paginatedData = { clients: [], totalPages: 0 }, isLoading, error } = useQuery({
    queryKey: ['clients', 'paginated', currentPage, showBookmarked],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: CLIENTS_PER_PAGE,
        excludeRecent: 'true'
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

  // Display clients logic
  const displayClients = () => {
    // First filter recent clients
    const filteredRecentClients = showRecentClients 
      ? getFilteredClients(recentClients, searchTerm, selectedStatus)
      : [];

    // Then filter paginated clients
    const filteredPaginatedClients = getFilteredClients(paginatedData.clients, searchTerm, selectedStatus);

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
      queryClient.invalidateQueries(['clients', 'recent']);
      queryClient.invalidateQueries(['stats']);
      setCurrentPage(1);
      showAlert('success', 'New client added successfully');
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
                    </div>
                  )}
                </>
              )}

              {/* Paginated Clients Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {searchTerm ? 'Search Results' : 'All Clients'}
                </h2>
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
        clientName={selectedIntelligenceClient?.name}
      />
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