export const STATUS_CONFIG = {
  stale: { 
    label: 'Stale', 
    classes: 'border-red-500 bg-red-50',
    icon: 'XCircle'
  },
  overdue: { 
    label: 'Overdue', 
    classes: 'border-yellow-500 bg-yellow-50',
    icon: 'Clock'
  },
  noContact: { 
    label: 'No Recent Contact', 
    classes: 'border-orange-500 bg-orange-50',
    icon: 'AlertCircle'
  },
  needsAttention: { 
    label: 'Needs Attention', 
    classes: 'border-blue-500 bg-blue-50',
    icon: 'Bell'
  },
  active: { 
    label: 'Active', 
    classes: 'border-green-500 bg-white',
    icon: 'CheckCircle'
  }
};

export const getClientStatus = (client) => {
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
    needsAttention: clients.filter(c => getClientStatus(c) === 'needsAttention').length,
    totalDeals: clients.reduce((sum, client) => sum + (client.deals?.length || 0), 0),
    pipeline: clients.reduce((sum, client) => 
      sum + (client.deals?.reduce((dealSum, deal) => 
        dealSum + (deal.status !== 'closed_lost' ? deal.value : 0), 0) || 0), 0)
  };
};