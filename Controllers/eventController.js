// controllers/eventController.js
const Event = require('../Models/Event');

// Create new event
exports.createEvent = async (req, res) => {
    const event = new Event(req.body);
    await event.save();
    res.send(event);
};

// Get all events
exports.getEvents = async (req, res) => {
    const events = await Event.find().populate('organizer');
    res.send(events);
};

// Update event with advanced update operators
exports.updateEvent = async (req, res) => {
    const event = await Event.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.send(event);
};

// Search events using text index
exports.searchEvents = async (req, res) => {
    const results = await Event.find({ $text: { $search: req.query.q } });
    res.send(results);
};


// Performance Analysis with explain()
exports.analyzePerformance = async (req, res) => {
    const result = await Event.find({ title: /conference/i }).explain("executionStats");
    console.log(result);
    res.send(result);
};