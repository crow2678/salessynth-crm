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
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net',
    // Add any other allowed origins
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enhanced JSON middleware with larger payload support
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Early health check
app.get('/early-health', (req, res) => {
  res.json({ 
    status: 'starting', 
    timestamp: new Date().toISOString() 
  });
});

// Enhanced Cosmos DB Connection
const connectDB = async (retries = 5) => {
  console.log('Starting database connection attempt...');
  
  const connectionString = 
    process.env.MONGODB_URI || 
    process.env.CUSTOMCONNSTR_MONGODB_URI || 
    process.env.MONGODBCONNSTR_MONGODB_URI;

  if (!connectionString) {
    console.error('No MongoDB connection string found.');
    throw new Error('Missing database connection string');
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: false,
    ssl: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 45000,
    connectTimeoutMS: 45000,
    socketTimeoutMS: 480000
  };

  try {
    await mongoose.connect(connectionString, options);
    console.log('✅ Connected to Cosmos DB successfully');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    
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

// Export connection function for potential external use
module.exports.connectDB = connectDB;
// Client Routes with Comprehensive Error Handling
app.post('/api/clients', async (req, res) => {
  try {
    const { name, email, ...otherFields } = req.body;
    
    // Validate name (required)
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        message: 'Client name is required' 
      });
    }

    // Email validation (optional but with format check if provided)
    let processedEmail = null;
    if (email) {
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ 
          message: 'Invalid email format' 
        });
      }
      processedEmail = email.trim().toLowerCase();
    }

    // Prepare client data
    const clientData = {
      name: name.trim(),
      email: processedEmail,
      ...otherFields
    };

    // Create new client
    const newClient = new Client(clientData);
    
    // Save the client
    await newClient.save();

    console.log(`New client created: ${newClient._id}`);

    // Respond with the created client
    res.status(201).json(newClient);

  } catch (error) {
    console.error('Detailed Error Creating Client:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({ 
        message: 'Validation Error', 
        errors: validationErrors
      });
    }

    // Handle duplicate key errors (specifically for unique email)
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'A client with this email already exists',
        duplicateFields: Object.keys(error.keyValue)
      });
    }

    // Generic error response
    res.status(500).json({ 
      message: 'Error creating client', 
      error: error.message 
    });
  }
});

// Update client route
app.put('/api/clients/:id', async (req, res) => {
  try {
    // Validate the client ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }

    // Remove system-generated fields
    const { _id, __v, createdAt, updatedAt, ...updateData } = req.body;

    // Find and update the client
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true,  // Return the updated document
        runValidators: true,  // Run model validation on update
        context: 'query'  // Needed for custom validation
      }
    );

    // Check if client was found and updated
    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Log the update for tracking
    console.log(`Client updated: ${updatedClient._id}`);

    // Return the updated client
    res.json(updatedClient);

  } catch (error) {
    console.error('Error updating client:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation Error', 
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'Duplicate key error',
        duplicateFields: Object.keys(error.keyValue)
      });
    }

    // Generic error response
    res.status(500).json({ 
      message: 'Error updating client', 
      error: error.message 
    });
  }
});

// Patch route for bookmarking
app.patch('/api/clients/:id/bookmark', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }

    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Toggle bookmark status
    client.isBookmarked = !client.isBookmarked;
    await client.save();

    res.json({ 
      message: 'Bookmark status updated', 
      isBookmarked: client.isBookmarked 
    });

  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ 
      message: 'Error toggling bookmark', 
      error: error.message 
    });
  }
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
      console.log(`🔗 Database Connected: ${mongoose.connection.host}`);
    });

    // Graceful shutdown handler
    const shutdownHandler = async () => {
      console.log('Shutting down gracefully...');
      try {
        server.close(() => {
          console.log('HTTP server closed');
          mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
          });
        });
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    // Setup shutdown handlers
    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
      process.on(signal, shutdownHandler);
    });

    // Global error handlers
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      shutdownHandler();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdownHandler();
    });

  } catch (err) {
    console.error('Fatal error during initialization:', err);
    process.exit(1);
  }
};

// Start the application
initializeApp().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});

module.exports = app;