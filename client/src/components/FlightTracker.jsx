// components/FlightTracker.jsx
import React, { useState, useEffect } from 'react';
import { Plane, PlaneLanding, Clock, AlertCircle, X } from 'lucide-react';

const FlightTracker = ({ user }) => {
  const [flights, setFlights] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.flightTrackingEnabled && isOpen) {
      fetchFlights();
      // Refresh every 5 minutes
      const interval = setInterval(fetchFlights, 300000);
      return () => clearInterval(interval);
    }
  }, [user, isOpen]);

  const fetchFlights = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/flights', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flights');
      }

      const data = await response.json();
      setFlights(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch flight data');
      console.error('Flight fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFlightStatusColor = (status) => {
    const statusColors = {
      active: 'text-blue-500',
      scheduled: 'text-gray-500',
      landed: 'text-green-500',
      delayed: 'text-red-500',
      cancelled: 'text-red-500'
    };
    return statusColors[status] || 'text-gray-500';
  };

  if (!user?.flightTrackingEnabled) {
    return (
      <div className="relative">
        <button
          className="p-2 text-gray-400 cursor-not-allowed"
          title="Premium Feature: Flight Tracking"
        >
          <Plane className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-all relative"
        title="Flight Tracker"
      >
        <Plane className={`h-5 w-5 ${isLoading ? 'animate-pulse' : ''}`} />
        {flights.some(f => f.status === 'delayed') && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">Flight Tracker</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            {error ? (
              <div className="text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            ) : flights.length === 0 ? (
              <p className="text-gray-500 text-center">No flights being tracked</p>
            ) : (
              <div className="space-y-4">
                {flights.map(flight => (
                  <div key={flight._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {flight.status === 'active' ? (
                        <Plane className={`h-5 w-5 ${getFlightStatusColor(flight.status)}`} />
                      ) : flight.status === 'landed' ? (
                        <PlaneLanding className={`h-5 w-5 ${getFlightStatusColor(flight.status)}`} />
                      ) : (
                        <Clock className={`h-5 w-5 ${getFlightStatusColor(flight.status)}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{flight.flightNumber}</p>
                      <div className="text-sm text-gray-500">
                        <p>{flight.departure.airport} → {flight.arrival.airport}</p>
                        <p className={getFlightStatusColor(flight.status)}>
                          Status: {flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
                        </p>
                        {flight.status === 'delayed' && flight.departure.actual && (
                          <p className="text-red-500 text-xs mt-1">
                            Delayed: {Math.round((new Date(flight.departure.actual) - new Date(flight.departure.scheduled)) / 60000)} minutes
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightTracker;