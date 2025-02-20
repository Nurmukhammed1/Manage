// routes/registrationRoutes.js
const express = require('express');
const router = express.Router();
const registrationController = require('../Controllers/registrationController');
const authMiddleware = require('../Middleware/authMiddleware');

// Register attendee to an event
router.post('/registrations', registrationController.registerAttendee);

// Get registration details by ID
router.get('/registrations/:id', registrationController.getRegistration);

// Update registration status (e.g., check-in)
router.put('/registrations/:id', authMiddleware.authenticateUser, registrationController.updateRegistration);

// Cancel a registration
router.delete('/registrations/:id',  authMiddleware.authenticateUser, registrationController.cancelRegistration);

// Get event statistics
router.get('/events/stats', registrationController.getEventStats);

// Get registrations for a specific event with optional filters
router.get('/events/:eventId/registrations', registrationController.getEventRegistrations);

module.exports = router;