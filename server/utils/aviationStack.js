// utils/aviationStack.js

const AVIATION_STACK_API = 'http://api.aviationstack.com/v1';
const API_KEY = process.env.AVIATION_STACK_API_KEY;

// Cache to store API responses and manage rate limiting
const apiCache = {
  lastCall: null,
  callCount: 0,
  cache: new Map(),
  RATE_LIMIT: 1, // Calls per second
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// Helper to check rate limiting
const checkRateLimit = () => {
  const now = Date.now();
  if (apiCache.lastCall) {
    const timeSinceLastCall = now - apiCache.lastCall;
    if (timeSinceLastCall < 1000 && apiCache.callCount >= apiCache.RATE_LIMIT) {
      throw new Error('Rate limit exceeded');
    }
    if (timeSinceLastCall >= 1000) {
      apiCache.callCount = 0;
    }
  }
  apiCache.lastCall = now;
  apiCache.callCount++;
};

// Helper to check cache
const checkCache = (flightNumber) => {
  const cached = apiCache.cache.get(flightNumber);
  if (cached && Date.now() - cached.timestamp < apiCache.CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper to set cache
const setCache = (flightNumber, data) => {
  apiCache.cache.set(flightNumber, {
    data,
    timestamp: Date.now()
  });
};

// Main fetch function
const fetchFlightData = async (flightNumber) => {
  try {
    // Check cache first
    const cached = checkCache(flightNumber);
    if (cached) {
      return cached;
    }

    // Check rate limiting
    checkRateLimit();

    // Construct URL with API key
    const url = new URL(`${AVIATION_STACK_API}/flights`);
    url.searchParams.append('access_key', API_KEY);
    url.searchParams.append('flight_iata', flightNumber);

    // Make API call
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('API rate limit exceeded');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle API-specific error responses
    if (data.error) {
      throw new Error(data.error.message || 'Aviation Stack API error');
    }

    // Validate response has flight data
    if (!data.data || !data.data[0]) {
      throw new Error('Flight not found');
    }

    const flightData = data.data[0];

    // Transform to our standard format
    const standardizedData = {
      flightNumber: flightData.flight.iata,
      status: mapFlightStatus(flightData.flight_status),
      departure: {
        airport: flightData.departure.iata,
        scheduled: new Date(flightData.departure.scheduled),
        actual: flightData.departure.actual ? new Date(flightData.departure.actual) : null,
        terminal: flightData.departure.terminal,
        gate: flightData.departure.gate
      },
      arrival: {
        airport: flightData.arrival.iata,
        scheduled: new Date(flightData.arrival.scheduled),
        actual: flightData.arrival.actual ? new Date(flightData.arrival.actual) : null,
        terminal: flightData.arrival.terminal,
        gate: flightData.arrival.gate
      },
      airline: {
        name: flightData.airline.name,
        iata: flightData.airline.iata
      }
    };

    // Cache the standardized response
    setCache(flightNumber, standardizedData);

    return standardizedData;
  } catch (error) {
    console.error('Aviation Stack API error:', error);
    throw error;
  }
};

// Helper to map API status to our standard statuses
const mapFlightStatus = (status) => {
  const statusMap = {
    scheduled: 'scheduled',
    active: 'active',
    landed: 'landed',
    cancelled: 'cancelled',
    incident: 'cancelled',
    diverted: 'delayed'
  };
  return statusMap[status] || 'scheduled';
};

// Export functions
module.exports = {
  fetchFlightData,
  // Expose for testing
  _testing: {
    checkCache,
    checkRateLimit,
    apiCache
  }
};