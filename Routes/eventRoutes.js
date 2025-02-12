// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../Controllers/eventController');
const { authorizeRoles } = require('../Middleware/authorizeRoles');

// Event routes
router.post('/', eventController.createEvent); // Create event
router.get('/', eventController.getEvents); // Get events
router.put('/:id', eventController.updateEvent); // Update event
router.get('/search', eventController.searchEvents); // Search events
router.get('/analyze', eventController.analyzePerformance); // Performance Analysis

module.exports = router;