// routes/flightRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Flight = require('../models/Flight');
const User = require('../models/User');

// Aviation Stack API Configuration
const AVIATION_STACK_API_KEY = process.env.AVIATION_STACK_API_KEY;
const AVIATION_STACK_API = 'http://api.aviationstack.com/v1';

// Premium feature middleware
const premiumFeatureMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.flightTrackingEnabled) {
            return res.status(403).json({ 
                message: 'Premium feature not enabled',
                feature: 'flight_tracking'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking premium status' });
    }
};

// Helper function to fetch flight data
const fetchFlightData = async (flightNumber) => {
    try {
        const response = await fetch(`${AVIATION_STACK_API}/flights?access_key=${AVIATION_STACK_API_KEY}&flight_iata=${flightNumber}`);
        const data = await response.json();
        
        if (!data?.data?.[0]) {
            throw new Error('Flight not found');
        }
        
        return data.data[0];
    } catch (error) {
        console.error('Aviation Stack API error:', error);
        throw error;
    }
};

// Get all tracked flights
router.get('/', [authMiddleware, premiumFeatureMiddleware], async (req, res) => {
    try {
        const flights = await Flight.find({ userId: req.userId });
        res.json(flights);
    } catch (error) {
        console.error('Error fetching flights:', error);
        res.status(500).json({ message: 'Error fetching flights', error: error.message });
    }
});

// Add new flight tracking
router.post('/', [authMiddleware, premiumFeatureMiddleware], async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const flightCount = await Flight.countDocuments({ userId: req.userId });
        
        if (flightCount >= user.flightTrackingQuota) {
            return res.status(403).json({ 
                message: 'Flight tracking quota exceeded',
                quota: user.flightTrackingQuota,
                current: flightCount
            });
        }

        // Validate and fetch flight data
        const flightData = await fetchFlightData(req.body.flightNumber);
        
        const flight = new Flight({
            userId: req.userId,
            flightNumber: req.body.flightNumber,
            status: flightData.flight_status || 'scheduled',
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
            lastUpdated: new Date(),
            cachedApiResponse: flightData
        });

        await flight.save();
        res.status(201).json(flight);
    } catch (error) {
        console.error('Error creating flight tracking:', error);
        res.status(400).json({ 
            message: 'Error creating flight tracking',
            error: error.message 
        });
    }
});

// Delete flight tracking
router.delete('/:id', [authMiddleware, premiumFeatureMiddleware], async (req, res) => {
    try {
        const flight = await Flight.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }
        
        res.json({ message: 'Flight tracking removed successfully' });
    } catch (error) {
        console.error('Error deleting flight:', error);
        res.status(500).json({ message: 'Error deleting flight' });
    }
});

// Get flight status
router.get('/:id/status', [authMiddleware, premiumFeatureMiddleware], async (req, res) => {
    try {
        const flight = await Flight.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        // Check if we need to refresh the data
        const lastUpdate = new Date(flight.lastUpdated);
        const now = new Date();
        const minutesSinceUpdate = (now - lastUpdate) / 1000 / 60;

        if (minutesSinceUpdate >= 5) { // Refresh every 5 minutes
            try {
                const flightData = await fetchFlightData(flight.flightNumber);
                
                flight.status = flightData.flight_status || flight.status;
                flight.departure = {
                    ...flight.departure,
                    actual: flightData.departure.actual ? new Date(flightData.departure.actual) : flight.departure.actual,
                    terminal: flightData.departure.terminal || flight.departure.terminal,
                    gate: flightData.departure.gate || flight.departure.gate
                };
                flight.arrival = {
                    ...flight.arrival,
                    actual: flightData.arrival.actual ? new Date(flightData.arrival.actual) : flight.arrival.actual,
                    terminal: flightData.arrival.terminal || flight.arrival.terminal,
                    gate: flightData.arrival.gate || flight.arrival.gate
                };
                flight.lastUpdated = now;
                flight.cachedApiResponse = flightData;
                
                await flight.save();
            } catch (apiError) {
                console.warn('Could not refresh flight data:', apiError);
                // Continue with cached data
            }
        }

        res.json(flight);
    } catch (error) {
        console.error('Error fetching flight status:', error);
        res.status(500).json({ message: 'Error fetching flight status' });
    }
});

// Toggle flight tracking feature
router.post('/toggle-tracking', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { enabled } = req.body;
        await user.updateOne({
            flightTrackingEnabled: enabled,
            'premiumFeatures.flightTracking': enabled
        });

        // If disabling, remove all tracked flights
        if (!enabled) {
            await Flight.deleteMany({ userId: req.userId });
        }

        res.json({ 
            message: `Flight tracking ${enabled ? 'enabled' : 'disabled'} successfully`,
            flightTrackingEnabled: enabled
        });
    } catch (error) {
        console.error('Error updating flight tracking:', error);
        res.status(500).json({ message: 'Error updating flight tracking' });
    }
});

module.exports = router;