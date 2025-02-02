require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Client = require('./models/Client');
const Task = require('./models/Task');
const Bookmark = require('./models/Bookmark');

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Early health check
app.get('/early-health', (req, res) => {
  res.json({ status: 'starting' });
});

// Cosmos DB Connection
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
    if (retries > 0) {
      console.log(`Connection attempt failed. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    console.error('❌ Connection error:', err.message);
    throw err;
  }
};

// Database connection monitoring
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
  if (err.name === 'MongoError' && err.code === 16500) {
    console.log('Throughput limit reached, implementing backoff...');
    setTimeout(() => {
      mongoose.connect().catch(console.error);
    }, Math.random() * 5000);
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected, attempting to reconnect...');
  setTimeout(() => {
    connectDB().catch(console.error);
  }, 5000);
});

// Task Routes
app.get('/api/tasks', async (req, res) => {
  try {
    const { completed } = req.query;
    let query = {};
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    console.log('Attempting to delete task:', req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid task ID format:', req.params.id);
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      console.log('Task not found:', req.params.id);
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('Successfully deleted task:', req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(req.params.id);
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
// Bookmark Routes
app.get('/api/bookmarks', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find().lean();
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Error fetching bookmarks', error: error.message });
  }
});

app.post('/api/bookmarks', async (req, res) => {
  try {
    const { title, url } = req.body;
    
    // Validate required fields
    if (!title?.trim() || !url?.trim()) {
      return res.status(400).json({ 
        message: 'Title and URL are required',
        error: 'Missing required fields' 
      });
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Validate URL format
    try {
      new URL(formattedUrl);
    } catch (e) {
      return res.status(400).json({ 
        message: 'Invalid URL format',
        error: 'URL validation failed' 
      });
    }

    const bookmark = new Bookmark({
      title: title.trim(),
      url: formattedUrl
    });

    await bookmark.save();
    res.status(201).json(bookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(400).json({ 
      message: 'Error creating bookmark', 
      error: error.message 
    });
  }
});

app.delete('/api/bookmarks/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bookmark ID format' });
    }

    const bookmark = await Bookmark.findByIdAndDelete(req.params.id);
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    res.json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ message: 'Error deleting bookmark', error: error.message });
  }
});

// Client Routes
app.get('/api/clients', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const bookmarkedOnly = req.query.bookmarked === 'true';

    let query = {};
    if (bookmarkedOnly) {
      query.isBookmarked = true;
    }

    const clients = await Client.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

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

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      Client.countDocuments(),
      Client.countDocuments({ isActive: true }),
      Client.countDocuments({ isBookmarked: true }),
      Client.aggregate([
        { $unwind: { path: '$deals', preserveNullAndEmptyArrays: true } },
        { $match: { 'deals.status': { $ne: 'closed_lost' } } },
        { $group: { 
          _id: null, 
          totalValue: { $sum: '$deals.value' },
          dealCount: { $sum: 1 }
        }}
      ])
    ]);

    res.json({
      totalClients: stats[0],
      activeClients: stats[1],
      bookmarkedClients: stats[2],
      totalDeals: stats[3][0]?.dealCount || 0,
      pipelineValue: stats[3][0]?.totalValue || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.json({
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      mongooseState: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(503).json({
      message: 'Service Unavailable',
      error: error.message
    });
  }
});

// Catch-all route for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Handle Cosmos DB specific errors
  if (err.code === 16500) {
    return res.status(429).json({
      message: 'Database throughput limit reached. Please try again in a moment.'
    });
  }
  
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

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handler
    const shutdownHandler = async () => {
      console.log('Shutting down gracefully...');
      try {
        await new Promise(resolve => server.close(resolve));
        console.log('Server closed');
        
        await mongoose.connection.close();
        console.log('Database connection closed');
        
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    // Setup shutdown handlers
    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
      process.on(signal, shutdownHandler);
    });

    // Handle uncaught errors
    process.on('uncaughtException', async (err) => {
      console.error('Uncaught exception:', err);
      await shutdownHandler();
    });

    process.on('unhandledRejection', async (err) => {
      console.error('Unhandled rejection:', err);
      await shutdownHandler();
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