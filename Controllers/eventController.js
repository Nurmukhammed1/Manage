// controllers/eventController.js
const Event = require('../Models/Event');
const mongoose = require('mongoose');
const User = require('../Models/User');
const Registration = require('../Models/Registration');

exports.createEvent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const event = new Event(req.body);
      await event.save({ session });
      
      // Update organizer metrics
      await User.updateOne(
        { _id: req.body.organizer },
        { $inc: { 'organizerMetrics.eventsCreated': 1 } },
        { session }
      );
      
      await session.commitTransaction();
      res.send(event);
    } catch (error) {
      await session.abortTransaction();
      res.status(500).send(error);
    } finally {
      session.endSession();
    }
  };
  
exports.getEvents = async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status,
      distance,
      coordinates 
    } = req.query;
  
    let query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    
    // Geospatial query if coordinates provided
    if (coordinates && distance) {
      const [lng, lat] = coordinates.split(',').map(Number);
      query['location.address.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: parseInt(distance) * 1000 // Convert km to meters
        }
      };
    }
  
    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .populate('coOrganizers.user', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  
    res.send(events);
};
  
  // Advanced aggregation for event analytics
exports.getEventAnalytics = async (req, res) => {
    const stats = await Registration.aggregate([
      {
        $group: {
          _id: '$event',
          totalAttendees: { $sum: '$quantity' },
          avgTicketPrice: { $avg: '$payment.amount' },
          totalRevenue: { $sum: '$payment.amount' },
          statuses: {
            $push: {
              status: '$status',
              count: { $sum: 1 }
            }
          }
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
          avgTicketPrice: 1,
          totalRevenue: 1,
          registrationStatuses: '$statuses',
          registrationRate: {
            $multiply: [
              {
                $divide: [
                  '$totalAttendees',
                  '$eventDetails.location.capacity'
                ]
              },
              100
            ]
          }
        }
      }
    ]);
  
    res.send(stats);
};
  
// Bulk operations example
exports.bulkUpdateEvents = async (req, res) => {
    const bulkOps = req.body.updates.map(update => ({
      updateOne: {
        filter: { _id: update.eventId },
        update: { $set: update.changes },
        upsert: false
      }
    })); 
  
    const result = await Event.bulkWrite(bulkOps);
    res.send(result);
};


// Performance Analysis with explain()
exports.analyzePerformance = async (req, res) => {
    const result = await Event.find({ title: /conference/i }).explain("executionStats");
    console.log(result);
    res.send(result);
};