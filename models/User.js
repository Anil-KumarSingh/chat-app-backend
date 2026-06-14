const mongoose = require('mongoose');

// Schema for storing application users
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    onlineStatus: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically adds createdAt field, no updatedAt needed
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

module.exports = mongoose.model('User', userSchema);
