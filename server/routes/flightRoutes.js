// routes/flightRoutes.js
const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const User = require('../models/User');

// Middleware to check authentication
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = req.app.get('jwt').verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

// Middleware to check flight tracking permission
const premiumFeatureMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.flightTrackingEnabled) {
            return res.status(403).json({ 
                message: 'Flight tracking not enabled',
                feature: 'flight_tracking'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking feature access' });
    }
};

// Get all tracked flights
router.get('/', [authMiddleware, premiumFeatureMiddleware], async (req, res) => {
    try {
        const flights = await Flight.find({ userId: req.userId });
        res.json(flights);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching flights', 
            error: error.message 
        });
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

        const flight = new Flight({
            userId: req.userId,
            flightNumber: req.body.flightNumber,
            status: 'scheduled'
        });

        await flight.save();
        res.status(201).json(flight);
    } catch (error) {
        res.status(400).json({ 
            message: 'Error creating flight tracking',
            error: error.message 
        });
    }
});

// Delete a tracked flight
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
        res.status(500).json({ 
            message: 'Error deleting flight', 
            error: error.message 
        });
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

        res.json(flight);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching flight status', 
            error: error.message 
        });
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
        user.flightTrackingEnabled = enabled;
        await user.save();

        // If disabling, remove all tracked flights
        if (!enabled) {
            await Flight.deleteMany({ userId: req.userId });
        }

        res.json({ 
            message: `Flight tracking ${enabled ? 'enabled' : 'disabled'} successfully`,
            flightTrackingEnabled: enabled
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating flight tracking', 
            error: error.message 
        });
    }
});

module.exports = router;