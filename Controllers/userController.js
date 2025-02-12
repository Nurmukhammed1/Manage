// controllers/userController.js
const User = require('../Models/User');

// Create new user
exports.createUser = async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.send(user);
};

// Get all users
exports.getUsers = async (req, res) => {
    const users = await User.find().populate('profile');
    res.send(users);
};

// Bulk insert users
exports.bulkInsertUsers = async (req, res) => {
    const result = await User.insertMany(req.body);
    res.send(result);
};