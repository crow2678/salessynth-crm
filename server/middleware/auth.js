// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header and verify format
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error('No authentication token provided');
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('User account is deactivated');
            }

            // Add user info to request
            req.userId = decoded.userId;
            req.user = user;

            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new Error('Token has expired');
            }
            throw new Error('Invalid authentication token');
        }
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: error.message || 'Authentication failed'
        });
    }
};

module.exports = authMiddleware;