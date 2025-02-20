// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../Controllers/eventController');
const { authorizeRoles } = require('../Middleware/authMiddleware');

// Create an event
router.post('/events', eventController.createEvent);

// Get events with optional filters (pagination, category, status, geospatial search)
router.get('/events', eventController.getEvents);

// Get event analytics (aggregated stats)
router.get('/events/analytics', eventController.getEventAnalytics);

// Bulk update multiple events
router.put('/events/bulk-update', eventController.bulkUpdateEvents);

// Analyze query performance
router.get('/events/performance-analysis', eventController.analyzePerformance);

module.exports = router;