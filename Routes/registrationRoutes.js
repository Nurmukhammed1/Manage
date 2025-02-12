// routes/registrationRoutes.js
const express = require('express');
const router = express.Router();
const registrationController = require('../Controllers/registrationController');

// Registration routes
router.post('/', registrationController.registerAttendee); // Register attendee
router.get('/stats', registrationController.getEventStats); // Get event stats

module.exports = router;