// controllers/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const authController = {
    // Login handler
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate inputs
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find user
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            // Verify password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Send response
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    },

    // Get current user
    getCurrentUser: async (req, res) => {
        try {
            const user = await User.findById(req.userId).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user information'
            });
        }
    },

    // Create initial admin user
    createInitialAdmin: async () => {
        try {
            // Check if admin exists
            const adminExists = await User.findOne({ role: 'admin' });
            if (adminExists) {
                return;
            }

            // Create admin user
            await User.create({
                email: process.env.ADMIN_EMAIL || 'admin@example.com',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                isActive: true
            });

            console.log('Initial admin user created successfully');
        } catch (error) {
            console.error('Failed to create initial admin:', error);
        }
    }
};

module.exports = authController;