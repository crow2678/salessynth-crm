// models/Flight.js
const mongoose = require('mongoose');
const axios = require('axios');

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

// Static method to map Aviation Stack status
flightSchema.statics.mapAviationStackStatus = function(status) {
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

// Method to update flight status from Aviation Stack API
flightSchema.methods.updateFromAviationStack = async function() {
  try {
    const AVIATION_STACK_API_KEY = process.env.AVIATION_STACK_API_KEY;
    const AVIATION_STACK_API = 'http://api.aviationstack.com/v1';

    const response = await axios.get(`${AVIATION_STACK_API}/flights`, {
      params: {
        access_key: AVIATION_STACK_API_KEY,
        flight_iata: this.flightNumber
      }
    });

    const flightData = response.data.data[0];
    if (!flightData) return null;

    // Update flight status
    this.status = this.constructor.mapAviationStackStatus(flightData.flight_status);
    this.departure = {
      airport: flightData.departure.iata,
      scheduled: new Date(flightData.departure.scheduled),
      actual: flightData.departure.actual ? new Date(flightData.departure.actual) : null,
      terminal: flightData.departure.terminal,
      gate: flightData.departure.gate
    };
    this.arrival = {
      airport: flightData.arrival.iata,
      scheduled: new Date(flightData.arrival.scheduled),
      actual: flightData.arrival.actual ? new Date(flightData.arrival.actual) : null,
      terminal: flightData.arrival.terminal,
      gate: flightData.arrival.gate
    };
    this.lastUpdated = new Date();
    this.cachedApiResponse = flightData;

    await this.save();
    return this;
  } catch (error) {
    console.error('Aviation Stack API error:', error);
    return null;
  }
};

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;