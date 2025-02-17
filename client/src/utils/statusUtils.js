// statusUtils.js
export const STATUS_CONFIG = {
  recent: {
    label: 'Recent',
    classes: 'border-blue-600 bg-blue-50',
    icon: 'Clock',
    badge: 'bg-blue-100 text-blue-800'
  },
  stale: { 
    label: 'Stale', 
    classes: 'border-red-500 bg-red-50',
    icon: 'XCircle',
    badge: 'bg-red-100 text-red-800'
  },
  overdue: { 
    label: 'Overdue', 
    classes: 'border-yellow-500 bg-yellow-50',
    icon: 'Clock',
    badge: 'bg-yellow-100 text-yellow-800'
  },
  noContact: { 
    label: 'No Recent Contact', 
    classes: 'border-orange-500 bg-orange-50',
    icon: 'AlertCircle',
    badge: 'bg-orange-100 text-orange-800'
  },
  needsAttention: { 
    label: 'Needs Attention', 
    classes: 'border-blue-500 bg-blue-50',
    icon: 'Bell',
    badge: 'bg-blue-100 text-blue-800'
  },
  active: { 
    label: 'Active', 
    classes: 'border-green-500 bg-white',
    icon: 'CheckCircle',
    badge: 'bg-green-100 text-green-800'
  }
};

export const getClientStatus = (client) => {
  // Check for recent clients first
  if (client.isRecent) return 'recent';
  
  // Then check other statuses
  if (!client.isActive) return 'stale';
  if (client.followUpDate && new Date(client.followUpDate) < new Date()) return 'overdue';
  if (!client.lastContact) return 'needsAttention';
  
  const daysSinceContact = (new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24);
  if (daysSinceContact > 30) return 'noContact';
  if (daysSinceContact > 15) return 'needsAttention';
  return 'active';
};

export const getDealStatus = (deal) => {
  const stages = {
    prospecting: { label: 'Prospecting', color: 'text-gray-500' },
    qualified: { label: 'Qualified', color: 'text-blue-500' },
    proposal: { label: 'Proposal', color: 'text-purple-500' },
    negotiation: { label: 'Negotiation', color: 'text-orange-500' },
    closed_won: { label: 'Closed Won', color: 'text-green-500' },
    closed_lost: { label: 'Closed Lost', color: 'text-red-500' }
  };
  return stages[deal.status] || stages.prospecting;
};

export const calculateMetrics = (clients) => {
  return {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.isActive).length,
    recentClients: clients.filter(c => c.isRecent).length,
    needsAttention: clients.filter(c => getClientStatus(c) === 'needsAttention').length,
    totalDeals: clients.reduce((sum, client) => sum + (client.deals?.length || 0), 0),
    pipeline: clients.reduce((sum, client) => 
      sum + (client.deals?.reduce((dealSum, deal) => 
        dealSum + (deal.status !== 'closed_lost' ? deal.value : 0), 0) || 0), 0)
  };
};

// New helper functions
export const isRecentClient = (client) => {
  if (!client.createdAt) return false;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(client.createdAt) > thirtyDaysAgo;
};

export const filterClientsByStatus = (clients, status) => {
  if (status === 'all') return clients;
  if (status === 'recent') return clients.filter(c => c.isRecent);
  return clients.filter(c => getClientStatus(c) === status);
};

export const sortClients = (clients, sortBy = 'createdAt') => {
  return [...clients].sort((a, b) => {
    // Always show recent clients first
    if (a.isRecent && !b.isRecent) return -1;
    if (!a.isRecent && b.isRecent) return 1;
    
    // Then sort by specified field
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  });
};