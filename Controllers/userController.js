const User = require('../Models/User');
const Event = require('../Models/Event');
const Registration = require('../Models/Registration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User registration
exports.register = async (req, res) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create new user
        const user = new User({
            name: {
                first: req.body.firstName,
                last: req.body.lastName
            },
            email: req.body.email,
            role: req.body.role || 'attendee',
            authentication: {
                password: hashedPassword,
                mfaEnabled: false,
                lastLogin: new Date()
            },
            profile: {
                bio: req.body.bio,
                preferences: {
                    eventCategories: req.body.eventCategories || [],
                    notifications: {
                        email: true,
                        push: true,
                        sms: false
                    }
                }
            }
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

// User login
exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.authentication.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.authentication.lastLogin = new Date();
        user.authentication.loginHistory.push({
            timestamp: new Date(),
            ip: req.ip,
            device: req.headers['user-agent']
        });
        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-authentication.password')
            .populate('profile');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = ['name', 'phone', 'profile'];

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-authentication.password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

// Get all users (admin only)
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;
        
        let query = {};
        
        if (role) {
            query.role = role;
        }
        
        if (search) {
            query.$or = [
                { 'name.first': { $regex: search, $options: 'i' } },
                { 'name.last': { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-authentication.password')
            .populate('profile')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ 'name.first': 1 });

        const total = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Bulk insert users
exports.bulkInsertUsers = async (req, res) => {
    const session = await User.startSession();
    session.startTransaction();

    try {
        // Hash passwords for all users
        const usersWithHashedPasswords = await Promise.all(
            req.body.map(async (user) => {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                return {
                    ...user,
                    authentication: {
                        password: hashedPassword,
                        mfaEnabled: false
                    }
                };
            })
        );

        const result = await User.insertMany(usersWithHashedPasswords, { session });
        await session.commitTransaction();

        res.status(201).json({
            message: 'Users created successfully',
            count: result.length
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Bulk insert failed', error: error.message });
    } finally {
        session.endSession();
    }
};

// Get user's events
exports.getUserEvents = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let query = { organizer: req.params.id };
        if (status) {
            query.status = status;
        }

        const events = await Event.find(query)
            .populate('organizer', 'name email')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ 'date.start': -1 });

        const total = await Event.countDocuments(query);

        res.json({
            events,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user events', error: error.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    const session = await User.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user's events
        await Event.deleteMany({ organizer: user._id }, { session });
        
        // Cancel user's registrations
        await Registration.updateMany(
            { attendee: user._id },
            { $set: { status: 'cancelled' } },
            { session }
        );

        // Delete user
        await User.findByIdAndDelete(user._id, { session });

        await session.commitTransaction();
        res.json({ message: 'User and related data deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    } finally {
        session.endSession();
    }
};

// Get user activity
exports.getUserActivity = async (req, res) => {
    try {
        const userId = req.params.id;

        const [events, registrations] = await Promise.all([
            Event.find({ organizer: userId })
                .select('title date status analytics')
                .sort({ 'date.start': -1 })
                .limit(5),
            
            Registration.find({ attendee: userId })
                .populate('event', 'title date')
                .select('status createdAt')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        res.json({
            events,
            registrations,
            summary: {
                totalEventsOrganized: await Event.countDocuments({ organizer: userId }),
                totalRegistrations: await Registration.countDocuments({ attendee: userId })
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user activity', error: error.message });
    }
};