require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
//const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Model imports
const Client = require('./models/Client');
const Task = require('./models/Task');
const Bookmark = require('./models/Bookmark');
const User = require('./models/User');
const Flight = require('./models/Flight');

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/flights', require('./routes/flightRoutes'));

// Add early health check before DB connection
app.get('/early-health', (req, res) => {
  res.json({ status: 'starting' });
});

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Admin middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

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

// User Management Routes (Admin only)
app.get('/api/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

app.post('/api/users', adminMiddleware, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      isActive: true
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ message: 'Error creating user', error: error.message });
  }
});

app.put('/api/users/:id', adminMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
});

app.delete('/api/users/:id', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

app.post('/api/users/:id/reset-password', adminMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error resetting password', error: error.message });
  }
});

// Set random fallback for bcryptjs
bcrypt.setRandomFallback((len) => {
  return crypto.randomBytes(len);
});

// DB Connection
const connectDB = async (retries = 5) => {
  console.log('Starting database connection attempt...');
  
  const connectionString = 
    process.env.MONGODB_URI || 
    process.env.CUSTOMCONNSTR_MONGODB_URI || 
    process.env.MONGODBCONNSTR_MONGODB_URI;

  if (!connectionString) {
    console.error('No MongoDB connection string found.');
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
    console.error('❌ Connection error:', err.message);
    throw err;
  }
};

// Basic connection monitoring
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected, attempting to reconnect...');
  setTimeout(() => {
    connectDB().catch(console.error);
  }, 5000);
});

// Simple error handler middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error.code === 16500) {
    return res.status(429).json({
      message: 'Please wait a moment before trying again'
    });
  }
  
  res.status(500).json({
    message: 'Something went wrong, please try again'
  });
});
// Protected Task Routes
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { completed } = req.query;
    let query = {
      userId: req.userId,
      completed: completed === 'true'
    };
    const tasks = await Task.find(query).sort({ createdAt: -1 });
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
      userId: req.userId
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
});

app.patch('/api/tasks/:id/complete', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id,
      userId: req.userId 
    });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: 'Error updating task', error: error.message });
  }
});

// Protected Bookmark Routes
app.get('/api/bookmarks', authMiddleware, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.userId });
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
      userId: req.userId
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
    res.json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ message: 'Error deleting bookmark', error: error.message });
  }
});

// Protected Client Routes
app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const bookmarkedOnly = req.query.bookmarked === 'true';

    let query = { userId: req.userId };
    if (bookmarkedOnly) {
      query.isBookmarked = true;
    }
	
	console.log('MongoDB query:', query);
    const clients = await Client.find(query)
      .skip(skip)
      .limit(limit);

	console.log('Clients found:', {
      count: clients.length,
      firstClientId: clients[0]?._id,
      firstClientUserId: clients[0]?.userId
    });
	
    const total = await Client.countDocuments(query);

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

app.get('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Error fetching client', error: error.message });
  }
});

app.post('/api/clients', authMiddleware, async (req, res) => {
  try {
    const client = new Client({
      ...req.body,
      userId: req.userId
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
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(400).json({ message: 'Error updating client', error: error.message });
  }
});

app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
});

app.patch('/api/clients/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    client.isBookmarked = !client.isBookmarked;
    await client.save();
    
    res.json(client);
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Error toggling bookmark', error: error.message });
  }
});

app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = { userId: req.userId };
    
    if (startDate && endDate) {
      dateFilter['deals.expectedCloseDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalClients = await Client.countDocuments({ userId: req.userId });
    const activeClients = await Client.countDocuments({ userId: req.userId, isActive: true });
    const bookmarkedClients = await Client.countDocuments({ userId: req.userId, isBookmarked: true });
    
    const dealsPipeline = await Client.aggregate([
      { $match: { userId: req.userId } },
      { $unwind: '$deals' },
      {
        $match: {
          ...dateFilter,
          'deals.status': { $ne: 'closed_lost' }
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$deals.value' },
          dealCount: { $sum: 1 }
        }
      }
    ]);

    const closedDealsPipeline = await Client.aggregate([
      { $match: { userId: req.userId } },
      { $unwind: '$deals' },
      {
        $match: {
          ...dateFilter,
          'deals.status': 'closed_won'
        }
      },
      {
        $group: {
          _id: null,
          closedValue: { $sum: '$deals.value' },
          closedDealCount: { $sum: 1 }
        }
      }
    ]);

    const clientsWithUnreadAlerts = await Client.find({
      userId: req.userId,
      'alerts.isRead': false
    });
    
    const unreadAlertCount = clientsWithUnreadAlerts.reduce((count, client) => {
      return count + client.alerts.filter(alert => !alert.isRead).length;
    }, 0);

    const stats = {
      totalClients,
      activeClients,
      bookmarkedClients,
      totalDeals: dealsPipeline[0]?.dealCount || 0,
      pipelineValue: dealsPipeline[0]?.totalValue || 0,
      closedValue: closedDealsPipeline[0]?.closedValue || 0,
      closedDealCount: closedDealsPipeline[0]?.closedDealCount || 0,
      unreadAlerts: unreadAlertCount
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    mongooseState: mongoose.connection.readyState
  };
  try {
    res.send(healthcheck);
  } catch (e) {
    healthcheck.message = e;
    res.status(503).send();
  }
});

// Catch-all handler for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
  });
});

// Initialize application
const initializeApp = async () => {
  try {
    console.log('Starting application initialization...');
    await connectDB();

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Setup shutdown handlers
    const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        await gracefulShutdown(server);
      });
    });

  } catch (err) {
    console.error('Fatal error during initialization:', err);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (server) => {
  console.log('Received shutdown signal');
  
  try {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
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