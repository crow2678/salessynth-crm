const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
bookmarkSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware to ensure URL has protocol
bookmarkSchema.pre('save', function(next) {
  if (!this.url.startsWith('http://') && !this.url.startsWith('https://')) {
    this.url = 'https://' + this.url;
  }
  next();
});

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;