// Part 1: Setup and Middleware
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Model imports
const Client = require('./models/Client');
const Task = require('./models/Task');
const Bookmark = require('./models/Bookmark');
const User = require('./models/User');
const Flight = require('./models/Flight');

// Initialize express
const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());

// Flight routes - specific API route
app.use('/api/flights', require('./routes/flightRoutes'));

// Early health check
app.get('/early-health', (req, res) => {
  res.json({ status: 'starting' });
});

// Auth Middleware with Cosmos DB specific error handling
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'Please authenticate' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify user exists in Cosmos DB
      const user = await User.findById(decoded.userId).lean();
      if (!user) {
        console.log('User not found:', decoded.userId);
        return res.status(401).json({ message: 'User not found' });
      }

      req.userId = decoded.userId;
      req.user = user;
      next();
    } catch (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in auth' });
  }
};

// Admin middleware with Cosmos DB compatibility
const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Database Connection and Error Handling
const connectDB = async (retries = 5) => {
  console.log('Starting Cosmos DB connection attempt...');
  
  const connectionString = 
    process.env.MONGODB_URI || 
    process.env.CUSTOMCONNSTR_MONGODB_URI || 
    process.env.MONGODBCONNSTR_MONGODB_URI;

  if (!connectionString) {
    console.error('No Cosmos DB connection string found.');
    return false;
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: false,
    ssl: true,
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 360000
  };

  try {
    await mongoose.connect(connectionString, options);
    console.log('✅ Connected to Cosmos DB successfully');
    return true;
  } catch (err) {
    console.error('❌ Cosmos DB connection error:', err.message);
    throw err;
  }
};

// Connection monitoring for Cosmos DB
mongoose.connection.on('error', (err) => {
  console.error('Cosmos DB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Cosmos DB disconnected, attempting to reconnect...');
  setTimeout(() => {
    connectDB().catch(console.error);
  }, 5000);
});

// Set bcrypt fallback for Cosmos DB compatibility
bcrypt.setRandomFallback((len) => {
  return crypto.randomBytes(len);
});
// Part 2: API Routes and Handlers

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// User Profile Route
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Client Routes with Cosmos DB optimization
app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    const { recent } = req.query;
    const bookmarkedOnly = req.query.bookmarked === 'true';
    
    let query = { userId: req.userId.toString() };
    if (bookmarkedOnly) {
      query.isBookmarked = true;
    }

    if (recent === 'true') {
      const recentClients = await Client.find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      return res.json({ clients: recentClients });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(query)
    ]);

    res.json({
      clients,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalClients: total
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
});

app.post('/api/clients', authMiddleware, async (req, res) => {
  try {
    const client = new Client({
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(400).json({ message: 'Error creating client', error: error.message });
  }
});

app.put('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { 
        _id: req.params.id, 
        userId: req.userId 
      },
      { 
        ...req.body,
        updatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).lean();

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(400).json({ message: 'Error updating client', error: error.message });
  }
});

app.patch('/api/clients/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { 
        _id: req.params.id, 
        userId: req.userId 
      },
      [
        { 
          $set: { 
            isBookmarked: { $not: '$isBookmarked' },
            updatedAt: new Date()
          }
        }
      ],
      { new: true }
    ).lean();

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Error toggling bookmark', error: error.message });
  }
});

// Stats endpoint
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.userId };
    
    if (startDate && endDate) {
      query['deals.expectedCloseDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [
      totalClients,
      activeClients,
      bookmarkedClients,
      dealsPipeline,
      closedDealsPipeline
    ] = await Promise.all([
      Client.countDocuments({ userId: req.userId }),
      Client.countDocuments({ userId: req.userId, isActive: true }),
      Client.countDocuments({ userId: req.userId, isBookmarked: true }),
      Client.aggregate([
        { $match: { userId: req.userId } },
        { $unwind: '$deals' },
        { $match: { 'deals.status': { $ne: 'closed_lost' } } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$deals.value' },
            dealCount: { $sum: 1 }
          }
        }
      ]),
      Client.aggregate([
        { $match: { userId: req.userId } },
        { $unwind: '$deals' },
        { $match: { 'deals.status': 'closed_won' } },
        {
          $group: {
            _id: null,
            closedValue: { $sum: '$deals.value' },
            closedDealCount: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      totalClients,
      activeClients,
      bookmarkedClients,
      totalDeals: dealsPipeline[0]?.dealCount || 0,
      pipelineValue: dealsPipeline[0]?.totalValue || 0,
      closedValue: closedDealsPipeline[0]?.closedValue || 0,
      closedDealCount: closedDealsPipeline[0]?.closedDealCount || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});
// Part 3: Additional Routes and Server Initialization

// Task Routes optimized for Cosmos DB
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { completed } = req.query;
    let query = {
      userId: req.userId,
      completed: completed === 'true'
    };
    
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .lean();
      
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
});

// Bookmark Routes with Cosmos DB optimization
app.get('/api/bookmarks', authMiddleware, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Error fetching bookmarks', error: error.message });
  }
});

app.post('/api/bookmarks', authMiddleware, async (req, res) => {
  try {
    const bookmark = new Bookmark({
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await bookmark.save();
    res.status(201).json(bookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(400).json({ message: 'Error creating bookmark', error: error.message });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      cosmosDBState: mongoose.connection.readyState,
      lastPing: await mongoose.connection.db.admin().ping()
    };
    res.json(healthcheck);
  } catch (error) {
    res.status(503).json({
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Cosmos DB specific error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error.code === 16500) {
    return res.status(429).json({
      message: 'Please wait a moment before trying again'
    });
  }
  
  if (error.code >= 10000 && error.code < 20000) {
    return res.status(500).json({
      message: 'Database operation failed, please try again'
    });
  }
  
  res.status(500).json({
    message: 'Something went wrong, please try again'
  });
});

// Static file serving - after API routes but before catch-all
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all handler for React app - must be after API routes
app.get('*', (req, res) => {
  // Only handle non-API routes with this catch-all
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

// Application initialization
const initializeApp = async () => {
  try {
    console.log('Starting application initialization...');
    
    let connected = false;
    const maxRetries = 5;
    
    for (let i = 0; i < maxRetries && !connected; i++) {
      try {
        await connectDB();
        connected = true;
      } catch (error) {
        console.error(`Connection attempt ${i + 1} failed:`, error);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    if (!connected) {
      throw new Error('Failed to connect to Cosmos DB after multiple attempts');
    }

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Shutdown handlers
    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
      process.on(signal, async () => {
        try {
          await gracefulShutdown(server);
        } catch (err) {
          console.error(`Error during ${signal} shutdown:`, err);
          process.exit(1);
        }
      });
    });

    // Error handlers
    process.on('uncaughtException', async (err) => {
      console.error('Uncaught exception:', err);
      try {
        await gracefulShutdown(server);
      } catch (shutdownErr) {
        console.error('Error during exception shutdown:', shutdownErr);
        process.exit(1);
      }
    });

    process.on('unhandledRejection', async (err) => {
      console.error('Unhandled rejection:', err);
      try {
        await gracefulShutdown(server);
      } catch (shutdownErr) {
        console.error('Error during rejection shutdown:', shutdownErr);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('Fatal error during initialization:', err);
    process.exit(1);
  }
};

// Start the application
console.log('Beginning application startup...');
initializeApp().catch(err => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});

module.exports = app;