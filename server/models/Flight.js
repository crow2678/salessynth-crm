// models/Flight.js
const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  flightNumber: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'landed', 'delayed', 'cancelled'],
    default: 'scheduled'
  },
  departure: {
    airport: String,
    scheduled: Date,
    actual: Date,
    terminal: String,
    gate: String
  },
  arrival: {
    airport: String,
    scheduled: Date,
    actual: Date,
    terminal: String,
    gate: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  cachedApiResponse: {
    type: Object,
    select: false // Don't include in regular queries
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
flightSchema.index({ userId: 1, flightNumber: 1 });
flightSchema.index({ userId: 1, status: 1 });
flightSchema.index({ lastUpdated: 1 });

const Flight = mongoose.model('Flight', flightSchema);

// User model update - add to existing User.js
const userSchema = mongoose.Schema({
  // ... existing fields ...
  flightTrackingEnabled: {
    type: Boolean,
    default: false
  },
  flightTrackingQuota: {
    type: Number,
    default: 5 // Maximum number of tracked flights
  }
});

// components/FlightTracker.jsx
import React, { useState, useEffect } from 'react';
import { Plane, PlaneLanding, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const FlightTracker = ({ user }) => {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.flightTrackingEnabled) {
      fetchFlights();
      const interval = setInterval(fetchFlights, 300000); // Update every 5 minutes
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchFlights = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get('/api/flights');
      setFlights(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch flight data');
      console.error('Flight fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.flightTrackingEnabled) {
    return (
      <div className="relative">
        <button
          className="p-2 text-gray-400 cursor-not-allowed"
          title="Premium Feature: Flight Tracking"
        >
          <Plane className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg relative"
      >
        <Plane className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
        {flights.some(f => f.status === 'delayed') && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Flight Tracker</h3>
            {error ? (
              <div className="text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            ) : flights.length === 0 ? (
              <p className="text-gray-500">No flights being tracked</p>
            ) : (
              <div className="space-y-4">
                {flights.map(flight => (
                  <div key={flight._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {flight.status === 'active' ? (
                        <Plane className="w-5 h-5 text-blue-500" />
                      ) : flight.status === 'delayed' ? (
                        <Clock className="w-5 h-5 text-red-500" />
                      ) : (
                        <PlaneLanding className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{flight.flightNumber}</p>
                      <div className="text-sm text-gray-500">
                        <p>{flight.departure.airport} → {flight.arrival.airport}</p>
                        <p>Status: {flight.status}</p>
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

// API route - add to server.js
app.get('/api/flights', authMiddleware, async (req, res) => {
  try {
    const flights = await Flight.find({ userId: req.userId });
    res.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({ message: 'Error fetching flights' });
  }
});

app.post('/api/flights', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.flightTrackingEnabled) {
      return res.status(403).json({ message: 'Flight tracking not enabled' });
    }

    const flightCount = await Flight.countDocuments({ userId: req.userId });
    if (flightCount >= user.flightTrackingQuota) {
      return res.status(403).json({ message: 'Flight tracking quota exceeded' });
    }

    const flight = new Flight({
      ...req.body,
      userId: req.userId
    });
    await flight.save();
    res.status(201).json(flight);
  } catch (error) {
    console.error('Error creating flight:', error);
    res.status(400).json({ message: 'Error creating flight' });
  }
});

// Aviation Stack API integration service
const AVIATION_STACK_API_KEY = process.env.AVIATION_STACK_API_KEY;
const AVIATION_STACK_API = 'http://api.aviationstack.com/v1';

const updateFlightStatus = async (flight) => {
  try {
    const response = await axios.get(`${AVIATION_STACK_API}/flights`, {
      params: {
        access_key: AVIATION_STACK_API_KEY,
        flight_iata: flight.flightNumber
      }
    });

    const flightData = response.data.data[0];
    if (!flightData) return null;

    // Update flight status
    flight.status = mapAviationStackStatus(flightData.flight_status);
    flight.departure = {
      airport: flightData.departure.iata,
      scheduled: new Date(flightData.departure.scheduled),
      actual: flightData.departure.actual ? new Date(flightData.departure.actual) : null,
      terminal: flightData.departure.terminal,
      gate: flightData.departure.gate
    };
    flight.arrival = {
      airport: flightData.arrival.iata,
      scheduled: new Date(flightData.arrival.scheduled),
      actual: flightData.arrival.actual ? new Date(flightData.arrival.actual) : null,
      terminal: flightData.arrival.terminal,
      gate: flightData.arrival.gate
    };
    flight.lastUpdated = new Date();
    flight.cachedApiResponse = flightData;

    await flight.save();
    return flight;
  } catch (error) {
    console.error('Aviation Stack API error:', error);
    return null;
  }
};

const mapAviationStackStatus = (status) => {
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