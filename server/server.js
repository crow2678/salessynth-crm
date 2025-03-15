// Part 1: Setup and Middleware
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Define gracefulShutdown at the top level so it's accessible throughout the file
const gracefulShutdown = async (server) => {
  console.log('Received shutdown signal, closing connections...');
  
  try {
    // Close HTTP server if it exists
    if (server) {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
      console.log('HTTP server closed');
    }
    
    // Close MongoDB connection if connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    
    console.log('Graceful shutdown completed');
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }
};

// Model imports
const Client = require('./models/Client');
const Task = require('./models/Task');
const Bookmark = require('./models/Bookmark');
const User = require('./models/User');
const Flight = require('./models/Flight');
const Deal = require('./models/Deal');
const Feedback = require('./models/Feedback');
const Interaction = require('./models/Interaction');
// Add with other model imports
//const Research = require('./agentic/database/models/Research');
const researchRoutes = require('./agentic/routes/researchRoutes');

// Add this line after other imports
let isConnecting = false;
// Initialize express
const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());

// Flight routes - specific API route
app.use('/api/flights', require('./routes/flightRoutes'));
app.use('/api', researchRoutes);


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
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Already connected to CosmosDB (MongoDB API)');
    return true;
  }
  
  // Check if connection is in progress
  if (isConnecting) {
    console.log('Connection already in progress, skipping duplicate attempt');
    return false;
  }
  
  isConnecting = true;
  console.log('Starting Cosmos DB connection attempt...');
  
  const connectionString = 
    process.env.MONGODB_URI || 
    process.env.CUSTOMCONNSTR_MONGODB_URI || 
    process.env.MONGODBCONNSTR_MONGODB_URI;

  if (!connectionString) {
    console.error('No Cosmos DB connection string found.');
    isConnecting = false;
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
    console.log('✅ Connected to CosmosDB successfully');
    isConnecting = false;
    return true;
  } catch (err) {
    console.error('❌ Cosmos DB connection error:', err.message);
    isConnecting = false;
    throw err;
  }
};

// Connection monitoring for Cosmos DB
mongoose.connection.on('error', (err) => {
  console.error('Cosmos DB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Disconnected from CosmosDB');
  if (!isConnecting && mongoose.connection.readyState !== 1) {
    setTimeout(() => {
      connectDB()
        .catch(err => { 
          console.error('❌ CosmosDB Connection Error:', err);
        });
    }, 5000);
  }
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

    // Handle recent vs paginated clients
    if (recent === 'true') {
      const recentClients = await Client.find(query)
        // Remove .sort() for Cosmos DB compatibility
        .limit(5)
        .lean();
      return res.json({ clients: recentClients });
    }

    // Regular paginated query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(query)
        // Remove .sort() for Cosmos DB compatibility
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

// Add with other route handlers for loading research collection 
app.get('/api/research/:clientId', authMiddleware, async (req, res) => {
    try {
        const research = await Research.findOne({
            userId: req.userId,  // Using req.userId from authMiddleware
            clientId: req.params.clientId
        }).lean();  // Using lean() for better performance

        if (!research) {
            return res.status(404).json({ 
                message: 'No research found for this client.' 
            });
        }

        res.json(research);
    } catch (error) {
        console.error('Error fetching research data:', error);
        res.status(500).json({ 
            message: 'Error fetching research data',
            error: error.message 
        });
    }
});
// Deal Routes
app.get('/api/deals', authMiddleware, async (req, res) => {
  try {
    const { clientId } = req.query;
    let query = { userId: req.userId };
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    const deals = await Deal.find(query).sort({ updatedAt: -1 }).lean();
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Error fetching deals', error: error.message });
  }
});

// Feedback Routes
app.post('/api/feedback', authMiddleware, async (req, res) => {
  try {
    const feedback = new Feedback({
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(400).json({ message: 'Error saving feedback', error: error.message });
  }
});

app.get('/api/feedback', authMiddleware, async (req, res) => {
  try {
    const { itemType, itemId } = req.query;
    let query = { userId: req.userId };
    
    if (itemType) {
      query.itemType = itemType;
    }
    
    if (itemId) {
      query.itemId = itemId;
    }
    
    const feedback = await Feedback.find(query).sort({ createdAt: -1 }).lean();
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

app.post('/api/deals', authMiddleware, async (req, res) => {
  try {
    const deal = new Deal({
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await deal.save();
    res.status(201).json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(400).json({ message: 'Error creating deal', error: error.message });
  }
});

app.get('/api/deals/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { userId: req.userId };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const [
      totalDeals,
      openDeals,
      closedWonDeals,
      closedLostDeals,
      dealValuePipeline
    ] = await Promise.all([
      Deal.countDocuments({ userId: req.userId }),
      Deal.countDocuments({ userId: req.userId, status: { $nin: ['closed_won', 'closed_lost'] } }),
      Deal.countDocuments({ userId: req.userId, status: 'closed_won' }),
      Deal.countDocuments({ userId: req.userId, status: 'closed_lost' }),
      Deal.aggregate([
        { $match: { userId: req.userId.toString() } },
        { $group: {
            _id: '$status',
            totalValue: { $sum: '$value' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    // Calculate win rate
    const winRate = (closedWonDeals / (closedWonDeals + closedLostDeals)) * 100 || 0;
    
    // Process deal values by stage
    const dealValueByStage = {};
    let totalPipelineValue = 0;
    let closedValue = 0;
    
    dealValuePipeline.forEach(stage => {
      dealValueByStage[stage._id] = {
        value: stage.totalValue,
        count: stage.count
      };
      
      if (stage._id === 'closed_won') {
        closedValue = stage.totalValue;
      } else if (stage._id !== 'closed_lost') {
        totalPipelineValue += stage.totalValue;
      }
    });
    
    res.json({
      totalDeals,
      openDeals,
      closedWonDeals,
      closedLostDeals,
      winRate: Math.round(winRate),
      pipelineValue: totalPipelineValue,
      closedValue,
      dealValueByStage
    });
  } catch (error) {
    console.error('Error fetching deal stats:', error);
    res.status(500).json({ message: 'Error fetching deal stats', error: error.message });
  }
});

app.get('/api/deals/:id', authMiddleware, async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, userId: req.userId }).lean();
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    res.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ message: 'Error fetching deal', error: error.message });
  }
});

app.put('/api/deals/:id', authMiddleware, async (req, res) => {
  try {
    const deal = await Deal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    res.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(400).json({ message: 'Error updating deal', error: error.message });
  }
});

// Deal Routes

// Interaction Routes
app.get('/api/interactions', authMiddleware, async (req, res) => {
  try {
    const { clientId, dealId, limit } = req.query;
    let query = { userId: req.userId };
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    if (dealId) {
      query.dealId = dealId;
    }
    
    const interactions = await Interaction.find(query)
      .sort({ date: -1 })
      .limit(limit ? parseInt(limit) : 0)
      .lean();
      
    res.json(interactions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ message: 'Error fetching interactions', error: error.message });
  }
});

app.post('/api/interactions', authMiddleware, async (req, res) => {
  try {
    const interaction = new Interaction({
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await interaction.save();
    res.status(201).json(interaction);
  } catch (error) {
    console.error('Error creating interaction:', error);
    res.status(400).json({ message: 'Error creating interaction', error: error.message });
  }
});

app.get('/api/interactions/stats', authMiddleware, async (req, res) => {
  try {
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }
    
    const engagementScore = await Interaction.calculateEngagementScore(clientId, req.userId);
    res.json(engagementScore);
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    res.status(500).json({ message: 'Error calculating engagement score', error: error.message });
  }
});

// Prediction Routes
app.post('/api/deals/:dealId/predict', authMiddleware, async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.dealId, userId: req.userId });
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    
    const client = await Client.findById(deal.clientId);
    
    if (!client) {
      return res.status(404).json({ message: 'Associated client not found' });
    }
    
    // Get recent interactions
    const interactions = await Interaction.find({ 
      dealId: deal._id,
      userId: req.userId 
    }).sort({ date: -1 }).limit(10).lean();
    
    // Extract factors from deal and client data
    const factors = extractDealFactors(deal, client, { interactions });
    
    // Calculate probability
    const probability = calculateWeightedProbability(deal, factors);
    
    // Create prediction object
    const prediction = {
      predictedAt: new Date(),
      probability,
      predictedCloseDate: calculateEstimatedCloseDate(deal),
      predictedStage: getRemainingStages(deal.status)[0] || deal.status,
      factors,
      confidenceScore: calculateConfidenceScore({ probability }, deal, ['internal']),
      stageEstimates: generateStagePredictions(deal.status, deal),
      timeToCloseEstimate: calculateTimeToClose(deal),
      actualOutcome: 'pending',
      source: 'system',
      dataSources: ['internal']
    };
    
    // Add prediction to deal
    deal.predictions.push(prediction);
    await deal.save();
    
    res.json(prediction);
  } catch (error) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ message: 'Error generating prediction', error: error.message });
  }
});

// Helper function for calculating time to close
function calculateTimeToClose(deal) {
  if (!deal.stageHistory || deal.stageHistory.length === 0) {
    return 30; // Default 30 days
  }
  
  const remainingStages = getRemainingStages(deal.status);
  let totalDays = 0;
  
  // Add time for each remaining stage based on average durations
  remainingStages.forEach(stage => {
    switch (stage) {
      case 'proposal':
        totalDays += 14;
        break;
      case 'negotiation':
        totalDays += 10;
        break;
      case 'closed_won':
        totalDays += 7;
        break;
      default:
        totalDays += 15;
    }
  });
  
  return totalDays;
}

app.get('/api/summary/:clientId/:userId', authMiddleware, async (req, res) => {
  try {
    // Fetch research summary for the client
    const research = await Research.findOne({
      clientId: req.params.clientId,
      userId: req.params.userId
    }).lean();

    if (!research) {
      return res.status(404).json({ 
        message: 'No research found for this client.' 
      });
    }

    res.json(research);
  } catch (error) {
    console.error('Error fetching research summary:', error);
    res.status(500).json({ 
      message: 'Error fetching research summary',
      error: error.message 
    });
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
    
    // Calculate deal success rate
    const dealSuccessRate = await Deal.aggregate([
      { $match: { userId: req.userId.toString(), status: { $in: ['closed_won', 'closed_lost'] } } },
      { $group: {
          _id: null,
          totalClosed: { $sum: 1 },
          wonDeals: { $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      totalClients,
      activeClients,
      bookmarkedClients,
      totalDeals: dealsPipeline[0]?.dealCount || 0,
      pipelineValue: dealsPipeline[0]?.totalValue || 0,
      closedValue: closedDealsPipeline[0]?.closedValue || 0,
      closedDealCount: closedDealsPipeline[0]?.closedDealCount || 0,
      dealSuccessRate: dealSuccessRate.length > 0 
        ? Math.round((dealSuccessRate[0].wonDeals / dealSuccessRate[0].totalClosed) * 100)
        : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

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

// Add this route to server.js
app.patch('/api/tasks/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
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

app.delete('/api/bookmarks/:id', authMiddleware, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark deleted successfully', bookmark });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ message: 'Error deleting bookmark', error: error.message });
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
app.get('*', (req, res, next) => {
  // Only handle non-API routes with this catch-all
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

// Prediction utility functions
function getRemainingStages(currentStage) {
  const orderedStages = [
    'prospecting',
    'qualified',
    'proposal',
    'negotiation',
    'closed_won'
  ];
  
  const currentIndex = orderedStages.indexOf(currentStage);
  if (currentIndex === -1) return [];
  
  return orderedStages.slice(currentIndex + 1);
}

function extractDealFactors(deal, client, metadata = {}) {
  const factors = {
    positive: [],
    negative: []
  };
  
  // Analyze factors based on deal and client data
  // This is a simplified version of the utility function
  
  if (deal.value && deal.value > 0) {
    factors.positive.push('Deal value specified');
  }
  
  if (deal.expectedCloseDate) {
    factors.positive.push('Expected close date defined');
  }
  
  if (client.lastContact) {
    const lastContactDate = new Date(client.lastContact);
    const daysSinceContact = Math.floor((new Date() - lastContactDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceContact < 7) {
      factors.positive.push('Recent client contact');
    } else if (daysSinceContact > 30) {
      factors.negative.push('No recent client contact');
    }
  } else {
    factors.negative.push('No contact history recorded');
  }
  
  // Add more factor extraction logic as needed
  
  return factors;
}

function calculateWeightedProbability(deal, factors) {
  // Base probability based on deal stage
  const stageWeights = {
    'prospecting': 20,
    'qualified': 40,
    'proposal': 60,
    'negotiation': 75,
    'closed_won': 100,
    'closed_lost': 0
  };
  
  // Start with base probability from stage
  let probability = stageWeights[deal.status] || 50;
  
  // Adjust based on positive factors
  if (factors.positive && factors.positive.length > 0) {
    probability += Math.min(factors.positive.length * 3, 15);
  }
  
  // Adjust based on negative factors
  if (factors.negative && factors.negative.length > 0) {
    probability -= Math.min(factors.negative.length * 4, 20);
  }
  
  // Ensure probability stays within 0-100 range
  return Math.min(Math.max(probability, 0), 100);
}

function calculateEstimatedCloseDate(deal) {
  // Get the current date as starting point
  const today = new Date();
  
  // Calculate based on average stage durations
  const remainingStages = getRemainingStages(deal.status);
  let totalRemainingDays = 0;
  
  remainingStages.forEach(stage => {
    switch (stage) {
      case 'proposal':
        totalRemainingDays += 14;
        break;
      case 'negotiation':
        totalRemainingDays += 10;
        break;
      case 'closed_won':
        totalRemainingDays += 7;
        break;
      default:
        totalRemainingDays += 15;
    }
  });
  
  // Calculate the close date
  const estimatedCloseDate = new Date(today);
  estimatedCloseDate.setDate(today.getDate() + totalRemainingDays);
  
  return estimatedCloseDate;
}

function calculateConfidenceScore(prediction, dealData, dataSources = []) {
  let score = 70; // Default base confidence
  
  // More data sources increases confidence
  if (dataSources && dataSources.length > 0) {
    score += Math.min(dataSources.length * 5, 15);
  }
  
  // More complete deal data increases confidence
  const hasCompleteData = dealData.value && 
                         dealData.expectedCloseDate && 
                         dealData.stageHistory && 
                         dealData.stageHistory.length > 1;
  
  if (hasCompleteData) {
    score += 5;
  } else {
    score -= 10;
  }
  
  // Ensure score stays within 0-100 range
  return Math.min(Math.max(score, 0), 100);
}

function generateStagePredictions(currentStage, dealData) {
  const remainingStages = getRemainingStages(currentStage);
  const stagePredictions = [];
  
  if (remainingStages.length === 0) {
    return [];
  }
  
  // Calculate baseline estimates
  remainingStages.forEach(stage => {
    let estimatedDays;
    
    switch (stage) {
      case 'proposal':
        estimatedDays = 14;
        break;
      case 'negotiation':
        estimatedDays = 10;
        break;
      case 'closed_won':
        estimatedDays = 7;
        break;
      default:
        estimatedDays = 15;
    }
    
    stagePredictions.push({
      stage,
      estimatedDays
    });
  });
  
  return stagePredictions;
}

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