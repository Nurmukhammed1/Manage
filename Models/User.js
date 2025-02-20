const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    bio: String,
    socialLinks: [{
      platform: String,
      url: String
    }],
    preferences: {
      eventCategories: [String],
      notifications: {
        email: Boolean,
        push: Boolean,
        sms: Boolean
      },
      privacy: {
        showProfile: Boolean,
        showAttendance: Boolean
      }
    },
    location: {
      city: String,
      country: String,
      timezone: String
    }
  });
  
const userSchema = new mongoose.Schema({
    name: {
      first: { type: String, required: true },
      last: { type: String, required: true }
    },
    email: { 
      type: String, 
      unique: true, 
      required: true 
    },
    phone: {
      number: String,
      verified: Boolean
    },
    role: { 
      type: String, 
      enum: ['admin', 'organizer', 'attendee', 'staff'],
      required: true 
    },
    profile: profileSchema,
    authentication: {
      password: String,
      mfaEnabled: Boolean,
      lastLogin: Date,
      loginHistory: [{
        timestamp: Date,
        ip: String,
        device: String
      }]
    },
    organizerMetrics: {
      eventsCreated: Number,
      totalAttendees: Number,
      averageRating: Number
    }
});
  
// Indexes
userSchema.index({ 'name.first': 1, 'name.last': 1 });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
  
module.exports = mongoose.model('User', userSchema);