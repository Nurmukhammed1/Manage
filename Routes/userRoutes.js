// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
const authMiddleware = require('../Middleware/authMiddleware');

// User registration
router.post('/register', userController.register);

// User login
router.post('/login', userController.login);

// Get user profile (authenticated user)
router.get('/profile', authMiddleware.authenticateUser, userController.getProfile);

// Update user profile
router.put('/profile', authMiddleware.authenticateUser, userController.updateProfile);

// Get all users (admin only)
router.get('/users', authMiddleware.authenticateUser, authMiddleware.authorizeAdmin, userController.getUsers);

// Bulk insert users (admin only)
router.post('/users/bulk', authMiddleware.authenticateUser, authMiddleware.authorizeAdmin, userController.bulkInsertUsers);

// Get user's events
router.get('/users/:id/events', authMiddleware.authenticateUser, userController.getUserEvents);

// Delete user (admin only)
router.delete('/users/:id', authMiddleware.authenticateUser, authMiddleware.authorizeAdmin, userController.deleteUser);

// Get user activity
router.get('/users/:id/activity', authMiddleware.authenticateUser, userController.getUserActivity);

module.exports = router;