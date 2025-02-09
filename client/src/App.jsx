import React, { useState } from 'react';
import { Search, UserPlus, Users, Bookmark, ListTodo, Link2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ClientCard from './components/ClientCard';
import NewClientModal from './components/NewClientModal';
import Alert from './components/Alert';
import TaskPanel from './components/TaskPanel';
import BookmarkPanel from './components/BookmarkPanel';
import DateFilter from './components/DateFilter';
import { getClientStatus, calculateMetrics } from './utils/statusUtils';
import { STATUS_CONFIG } from './utils/statusUtils';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SalesSynth = () => {
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(true);
  const [isBookmarkPanelOpen, setIsBookmarkPanelOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => ({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
  }));

  // Queries
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients', showBookmarked],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (showBookmarked) params.append('bookmarked', 'true');
      const { data } = await axios.get(`${API_URL}/clients?${params}`);
      return data.clients;
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

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: (newClient) => axios.post(`${API_URL}/clients`, newClient),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['stats']);
      showAlert('success', 'New client added successfully');
    },
    onError: (error) => {
      showAlert('error', error.response?.data?.message || 'Error creating client');
    }
  });

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

  const toggleBookmarkMutation = useMutation({
    mutationFn: async (clientId) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      const response = await axios.patch(`${API_URL}/clients/${clientId}/bookmark`);
      return response.data;
    },
    retry: (failureCount, error) => {
      return failureCount < 3 && error?.response?.status === 429;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000),
    onMutate: async (clientId) => {
      await queryClient.cancelQueries(['clients']);
      const previousClients = queryClient.getQueryData(['clients']);
      
      if (previousClients) {
        queryClient.setQueryData(['clients'], old => 
          old.map(c => c._id === clientId 
            ? { ...c, isBookmarked: !c.isBookmarked } 
            : c
          )
        );
      }
      
      return { previousClients };
    },
    onError: (error, clientId, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
      showAlert('error', error.message || 'Error toggling bookmark');
    },
    onSuccess: (data, clientId) => {
      const client = clients.find(c => c._id === clientId);
      if (client) {
        showAlert('success', `${client.name} ${data.isBookmarked ? 'added to' : 'removed from'} bookmarks`);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['stats']);
    }
  });
  // Handlers
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
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
      console.error('No client ID provided for bookmark toggle');
      showAlert('error', 'Unable to update bookmark');
      return;
    }

    try {
      await toggleBookmarkMutation.mutateAsync(clientId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Filtered clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || getClientStatus(client) === selectedStatus;
    return matchesSearch && matchesStatus;
  });

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
              </div>
              <div className="flex items-center space-x-6">
                <DateFilter onFilterChange={setDateFilter} />
                <div className="text-sm">
                  <div className="text-gray-500">Total Pipeline</div>
                  <div className="text-xl font-bold">${stats.pipelineValue?.toLocaleString() || 0}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Total Closed</div>
                  <div className="text-xl font-bold">${stats.closedValue?.toLocaleString() || 0}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Active Clients</div>
                  <div className="text-xl font-bold">{stats.activeClients || 0}</div>
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
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-between mb-8">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
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
                <Bookmark 
                  size={20} 
                  className={`mr-2 ${showBookmarked ? 'text-blue-600' : 'text-gray-500'}`} 
                />
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

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm p-8">
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
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map(client => (
                <ClientCard 
                  key={client._id} 
                  client={client} 
                  onEdit={handleEditClient}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
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
    </div>
  );
};

export default SalesSynth;