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

module.exports = Flight;