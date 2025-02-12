// models/Event.js
const mongoose = require('mongoose');

// Event Schema
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, text: true }, // Event title with text index
    description: String, // Event description
    date: { type: Date, required: true }, // Event date
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // One-to-Many Relationship with User
    tags: [String], // Tags for events (multi-key index candidate)
    createdAt: { type: Date, default: Date.now, expires: '90d' } // TTL index for automatic expiration
});

eventSchema.index({ title: 'text', tags: 1 }); // Compound index for text and tags

module.exports = mongoose.model('Event', eventSchema);
