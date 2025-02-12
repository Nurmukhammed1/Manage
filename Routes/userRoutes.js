// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');

// User routes
router.post('/', userController.createUser); // Create user
router.get('/', userController.getUsers); // Get users
router.post('/bulk', userController.bulkInsertUsers); // Bulk insert users

module.exports = router;