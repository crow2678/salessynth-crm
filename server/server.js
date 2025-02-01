require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Client = require('./models/Client');
const Task = require('./models/Task');
const Bookmark = require('./models/Bookmark');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection with error handling
// Cosmos DB Connection with retry logic
const connectDB = async (retries = 5) => {
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: false, // Important for Cosmos DB
        ssl: true,
        tlsInsecure: false,
        maxIdleTimeMS: 120000,
        directConnection: true,
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ Connected to Cosmos DB');
      break;
    } catch (err) {
      console.error(`❌ Cosmos DB connection error (${retries} retries left):`, err.message);
      retries -= 1;
      if (!retries) {
        console.error('Failed to connect to Cosmos DB after multiple retries');
        process.exit(1);
      }
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Initialize the database connection
connectDB().catch(console.error);

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

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

// Bookmark Routes
app.get('/api/bookmarks', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find().sort({ createdAt: -1 });
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
      .sort({ updatedAt: -1 })
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  // Gracefully shutdown on critical errors
  process.exit(1);
});

module.exports = app;