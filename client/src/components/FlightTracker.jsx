import React, { useState } from 'react';
import { Plane, Plus, AlertCircle, X, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

const FlightTracker = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [newFlight, setNewFlight] = useState({
    flightNumber: '',
    departure: {
      airport: '',
      scheduled: ''
    },
    arrival: {
      airport: '',
      scheduled: ''
    }
  });

  // Query for flights
  const { data: flights = [], isLoading } = useQuery({
    queryKey: ['flights'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/flights`);
      return data;
    },
    enabled: user?.flightTrackingEnabled && isOpen
  });

  // Add flight mutation
  const queryClient = useQueryClient();
  const addFlightMutation = useMutation({
    mutationFn: (flightData) => axios.post(`${API_URL}/flights`, flightData),
    onSuccess: () => {
      queryClient.invalidateQueries(['flights']);
      setShowAddFlight(false);
      setNewFlight({
        flightNumber: '',
        departure: { airport: '', scheduled: '' },
        arrival: { airport: '', scheduled: '' }
      });
    }
  });

  // Get most current flight
  const currentFlight = flights.length > 0
    ? flights.reduce((latest, flight) => {
        const flightDate = new Date(flight.departure.scheduled);
        const latestDate = new Date(latest.departure.scheduled);
        return flightDate > latestDate ? flight : latest;
      }, flights[0])
    : null;

  const handleAddFlight = async (e) => {
    e.preventDefault();
    await addFlightMutation.mutateAsync(newFlight);
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
        className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
        title="Flight Tracker"
      >
        <Plane className={`h-5 w-5 ${isLoading ? 'animate-pulse' : ''}`} />
        {currentFlight && (
          <span className="text-sm font-medium">{currentFlight.flightNumber}</span>
        )}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
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
            {!showAddFlight ? (
              <div className="space-y-4">
                {flights.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">No flights being tracked</p>
                    <button
                      onClick={() => setShowAddFlight(true)}
                      className="flex items-center justify-center w-full p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Flight
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Current Flight</h4>
                      <button
                        onClick={() => setShowAddFlight(true)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    {currentFlight && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold">{currentFlight.flightNumber}</span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            currentFlight.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            currentFlight.status === 'delayed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {currentFlight.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <div>
                            <p className="font-medium">{currentFlight.departure.airport}</p>
                            <p>{new Date(currentFlight.departure.scheduled).toLocaleTimeString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{currentFlight.arrival.airport}</p>
                            <p>{new Date(currentFlight.arrival.scheduled).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddFlight} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    value={newFlight.flightNumber}
                    onChange={(e) => setNewFlight(prev => ({
                      ...prev,
                      flightNumber: e.target.value
                    }))}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departure Airport
                    </label>
                    <input
                      type="text"
                      value={newFlight.departure.airport}
                      onChange={(e) => setNewFlight(prev => ({
                        ...prev,
                        departure: { ...prev.departure, airport: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departure Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newFlight.departure.scheduled}
                      onChange={(e) => setNewFlight(prev => ({
                        ...prev,
                        departure: { ...prev.departure, scheduled: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arrival Airport
                    </label>
                    <input
                      type="text"
                      value={newFlight.arrival.airport}
                      onChange={(e) => setNewFlight(prev => ({
                        ...prev,
                        arrival: { ...prev.arrival, airport: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arrival Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newFlight.arrival.scheduled}
                      onChange={(e) => setNewFlight(prev => ({
                        ...prev,
                        arrival: { ...prev.arrival, scheduled: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddFlight(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={addFlightMutation.isLoading}
                  >
                    {addFlightMutation.isLoading ? 'Adding...' : 'Add Flight'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightTracker;