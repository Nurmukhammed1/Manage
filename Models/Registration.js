// models/Registration.js
const mongoose = require('mongoose');

// Registration Schema
const registrationSchema = new mongoose.Schema({
    attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Many-to-Many Relationship
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    ticketQR: Buffer // BSON binary data for QR codes
});

module.exports = mongoose.model('Registration', registrationSchema);
