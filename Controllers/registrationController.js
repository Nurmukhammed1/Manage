// controllers/registrationController.js
const Registration = require('../Models/Registration');

// Register attendee to event
exports.registerAttendee = async (req, res) => {
    const registration = new Registration({
        attendee: req.body.attendeeId,
        event: req.body.eventId,
        ticketQR: Buffer.from('QR_CODE_PLACEHOLDER') // Placeholder for QR code (BSON binary)
    });
    await registration.save();
    res.send(registration);
};

// Aggregation pipeline for event statistics
exports.getEventStats = async (req, res) => {
    const stats = await Registration.aggregate([
        { $unwind: "$event" }, // Unwind event array
        { $group: { _id: "$event", totalAttendees: { $sum: 1 } } }, // Group by event
        { $project: { event: "$_id", totalAttendees: 1, _id: 0 } }, // Project required fields
        { $sort: { totalAttendees: -1 } } // Sort by number of attendees
    ]);
    res.send(stats);
};