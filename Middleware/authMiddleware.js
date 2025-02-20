const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Middleware to verify JWT token
exports.authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Fetch user details (optional, for role-based authorization)
        const user = await User.findById(req.user.userId).select('-authentication.password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user.role = user.role;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.', error: error.message });
    }
};

// Middleware to check if the user is an admin
exports.authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// Middleware to check if the user is an event organizer
exports.authorizeOrganizer = (req, res, next) => {
    if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Organizers only.' });
    }
    next();
};

// Middleware to check if the user is the account owner or an admin
exports.authorizeSelfOrAdmin = (req, res, next) => {
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied.' });
    }
    next();
};
