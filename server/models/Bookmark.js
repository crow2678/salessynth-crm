const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true,
    set: function(url) {
      // Add protocol if missing before validation
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
      }
      return url;
    },
    validate: {
      validator: function(v) {
        try {
          new URL(v);
          return true;
        } catch (err) {
          return false;
        }
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  minimize: true,
  autoIndex: false
});

// Update timestamps
bookmarkSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Optimized indexes for Cosmos DB
bookmarkSchema.index({ userId: 1, createdAt: -1 });
bookmarkSchema.index({ userId: 1, tags: 1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;