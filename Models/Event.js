const mongoose = require('mongoose');

// Location Schema (Embedded Document)
const locationSchema = new mongoose.Schema({
  venue: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  capacity: Number,
  facilities: [String]
});

// Ticket Tier Schema (Embedded Document)
const ticketTierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  benefits: [String],
  salesStart: Date,
  salesEnd: Date
});

// Event Schema
const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    text: true 
  },
  description: {
    short: String,
    full: String,
    highlights: [String]
  },
  category: {
    type: String,
    enum: ['conference', 'workshop', 'concert', 'sports', 'other'],
    required: true
  },
  date: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  location: locationSchema,
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  coOrganizers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    permissions: [String]
  }],
  ticketTiers: [ticketTierSchema],
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  media: {
    coverImage: Buffer,
    gallery: [Buffer],
    attachments: [{
      name: String,
      file: Buffer,
      mimeType: String
    }]
  },
  settings: {
    isPrivate: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: false },
    maxRegistrationsPerUser: { type: Number, default: 1 },
    waitlistEnabled: { type: Boolean, default: true }
  },
  analytics: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    registrationCount: { type: Number, default: 0 }
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: '90d' 
  }
});

// Indexes
eventSchema.index({ title: 'text', 'description.full': 'text', tags: 1 });
eventSchema.index({ 'location.address.coordinates': '2dsphere' });
eventSchema.index({ 'date.start': 1, 'date.end': 1 });
eventSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Event', eventSchema);
