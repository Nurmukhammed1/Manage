const Registration = require('../Models/Registration');
const Event = require('../Models/Event');
const mongoose = require('mongoose');

// Register attendee to event
exports.registerAttendee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if event exists and has available capacity
    const event = await Event.findById(req.body.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      attendee: req.body.attendeeId,
      event: req.body.eventId
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Create registration with selected ticket tier
    const registration = new Registration({
      attendee: req.body.attendeeId,
      event: req.body.eventId,
      ticketTier: req.body.ticketTierId,
      quantity: req.body.quantity || 1,
      status: 'confirmed',
      ticketQR: Buffer.from(`${req.body.eventId}-${req.body.attendeeId}-${Date.now()}`),
      payment: {
        amount: req.body.paymentAmount,
        status: 'completed',
        date: new Date()
      }
    });

    await registration.save({ session });

    // Update event registration count
    await Event.findByIdAndUpdate(
      req.body.eventId,
      { 
        $inc: { 
          'analytics.registrationCount': registration.quantity,
          'ticketTiers.$[tier].quantity': -registration.quantity
        }
      },
      { 
        arrayFilters: [{ 'tier._id': req.body.ticketTierId }],
        session 
      }
    );

    await session.commitTransaction();
    
    // Populate attendee and event details
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('attendee', 'name email')
      .populate('event', 'title date location');

    res.status(201).json(populatedRegistration);

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Registration failed', error: error.message });
  } finally {
    session.endSession();
  }
};

// Get registration details
exports.getRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('attendee', 'name email')
      .populate('event', 'title date location');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registration', error: error.message });
  }
};

// Update registration status
exports.updateRegistration = async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: req.body.status,
          'checkinHistory': req.body.status === 'checked-in' ? [{
            timestamp: new Date(),
            location: req.body.location,
            staff: req.user._id
          }] : undefined
        }
      },
      { new: true }
    ).populate('attendee event');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Error updating registration', error: error.message });
  }
};

// Cancel registration
exports.cancelRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Update registration status
    registration.status = 'cancelled';
    await registration.save({ session });

    // Return tickets to event capacity
    await Event.findByIdAndUpdate(
      registration.event,
      { 
        $inc: { 
          'analytics.registrationCount': -registration.quantity,
          'ticketTiers.$[tier].quantity': registration.quantity
        }
      },
      { 
        arrayFilters: [{ 'tier._id': registration.ticketTier }],
        session 
      }
    );

    await session.commitTransaction();
    res.json({ message: 'Registration cancelled successfully' });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error cancelling registration', error: error.message });
  } finally {
    session.endSession();
  }
};

// Get event statistics
exports.getEventStats = async (req, res) => {
  try {
    const stats = await Registration.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'checked-in'] }
        }
      },
      {
        $group: {
          _id: '$event',
          totalAttendees: { $sum: '$quantity' },
          checkedIn: {
            $sum: {
              $cond: [{ $eq: ['$status', 'checked-in'] }, '$quantity', 0]
            }
          },
          totalRevenue: { $sum: '$payment.amount' },
          ticketsSold: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      {
        $unwind: '$eventDetails'
      },
      {
        $project: {
          eventTitle: '$eventDetails.title',
          totalAttendees: 1,
          checkedIn: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ['$checkedIn', '$totalAttendees'] },
              100
            ]
          },
          totalRevenue: 1,
          ticketsSold: 1,
          _id: 0
        }
      },
      {
        $sort: { totalAttendees: -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error generating statistics', error: error.message });
  }
};

// Get registrations by event
exports.getEventRegistrations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { event: req.params.eventId };
    if (status) {
      query.status = status;
    }

    const registrations = await Registration.find(query)
      .populate('attendee', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Registration.countDocuments(query);

    res.json({
      registrations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error: error.message });
  }
};