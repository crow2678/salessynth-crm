require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Client = require('./models/Client');
const Task = require('./models/Task');
const Bookmark = require('./models/Bookmark');

// Initialize express but don't start listening yet
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// Add early health check before DB connection
app.get('/early-health', (req, res) => {
  res.json({ status: 'starting' });
});

// Cosmos DB Connection with enhanced debug logging
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

  while (retries) {
    try {
      console.log(`Connection attempt ${6-retries}/5`);
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: false,
        ssl: true,
        maxIdleTimeMS: 120000,
        serverSelectionTimeoutMS: 30000
      };
      
      await mongoose.connect(connectionString, options);
      console.log('✅ Connected to Cosmos DB successfully');
      return true;
    } catch (err) {
      console.error('❌ Connection error:', err.message);
      retries -= 1;
      if (!retries) {
        console.error('Failed to connect after all retries');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  return false;
};

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
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
});

app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
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

app.get('/api/tasks', async (req, res) => {
  try {
    const { completed } = req.query;
    let query = {};
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    
    // Remove sorting by createdAt
    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Bookmark Routes
// Modified bookmark route without sorting
app.get('/api/bookmarks', async (req, res) => {
  try {
    // Remove sorting by createdAt
    const bookmarks = await Bookmark.find();
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Error fetching bookmarks', error: error.message });
  }
});

app.post('/api/bookmarks', async (req, res) => {
  try {
    const bookmark = new Bookmark(req.body);
    await bookmark.save();
    res.status(201).json(bookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(400).json({ message: 'Error creating bookmark', error: error.message });
  }
});

app.delete('/api/bookmarks/:id', async (req, res) => {
  try {
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
// Modified client route with composite index support
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

    // Remove sorting by updatedAt since it's not indexed
    const clients = await Client.find(query)
      .skip(skip)
      .limit(limit);

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

app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Error fetching client', error: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(400).json({ message: 'Error creating client', error: error.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
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

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
});

app.patch('/api/clients/:id/bookmark', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
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

app.get('/api/stats', async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ isActive: true });
    const bookmarkedClients = await Client.countDocuments({ isBookmarked: true });
    
    const pipeline = await Client.aggregate([
      { $unwind: '$deals' },
      { $match: { 'deals.status': { $ne: 'closed_lost' } } },
      { $group: { 
        _id: null, 
        totalValue: { $sum: '$deals.value' },
        dealCount: { $sum: 1 }
      }}
    ]);

    const clientsWithUnreadAlerts = await Client.find({
      'alerts.isRead': false
    });
    
    const unreadAlertCount = clientsWithUnreadAlerts.reduce((count, client) => {
      return count + client.alerts.filter(alert => !alert.isRead).length;
    }, 0);

    const stats = {
      totalClients,
      activeClients,
      bookmarkedClients,
      totalDeals: pipeline[0]?.dealCount || 0,
      pipelineValue: pipeline[0]?.totalValue || 0,
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

// The "catch all" handler: for any request that doesn't
// match one above, send back React's index.html file.
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

// Graceful shutdown function
const gracefulShutdown = (server) => {
  console.log('Received shutdown signal');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      // Delay exit to ensure logs are written
      setTimeout(() => process.exit(1), 1000);
    });
  });
};

// Initialize application
const initializeApp = async () => {
  try {
    console.log('Starting application initialization...');
    
    // Attempt database connection
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to establish database connection');
      // Delay exit to ensure logs are written
      setTimeout(() => process.exit(1), 1000);
      return;
    }

    // Start server only after successful DB connection
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled rejection:', err);
      gracefulShutdown(server);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      gracefulShutdown(server);
    });

  } catch (err) {
    console.error('Fatal error during initialization:', err);
    // Delay exit to ensure logs are written
    setTimeout(() => process.exit(1), 1000);
  }
};

// Start the application
console.log('Beginning application startup...');
initializeApp().catch(err => {
  console.error('Fatal error during startup:', err);
  // Delay exit to ensure logs are written
  setTimeout(() => process.exit(1), 1000);
});

module.exports = app;