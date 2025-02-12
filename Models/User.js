// models/User.js
const mongoose = require('mongoose');

// Profile Schema (One-to-One Relationship)
const profileSchema = new mongoose.Schema({
    bio: String,
    socialLinks: [String]
});

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // User name
    email: { type: String, unique: true, required: true }, // Unique email
    role: { type: String, enum: ['organizer', 'attendee'], required: true }, // Role validation
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' } // Reference to Profile
});

module.exports = mongoose.model('User', userSchema);