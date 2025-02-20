const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    attendee: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    event: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Event' 
    },
    ticketTier: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'waitlisted'],
      default: 'pending'
    },
    ticketQR: Buffer,
    payment: {
      amount: Number,
      transactionId: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded']
      },
      date: Date
    },
    checkinHistory: [{
      timestamp: Date,
      location: String,
      staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
});
  
// Indexes
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ attendee: 1, event: 1 }, { unique: true });
  
module.exports = mongoose.model('Registration', registrationSchema);