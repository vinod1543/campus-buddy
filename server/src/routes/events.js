import { Router } from 'express';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Admin dashboard stats
router.get('/admin/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get all events (including past and private)
    const allEvents = await Event.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Add registration counts
    const eventsWithCounts = await Promise.all(
      allEvents.map(async (event) => {
        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          status: { $in: ['registered', 'checked_in'] }
        });
        
        return { ...event, registrationCount };
      })
    );

    // Calculate stats
    const now = new Date();
    const upcomingEvents = eventsWithCounts.filter(event => new Date(event.startAt) > now);
    const totalRegistrations = eventsWithCounts.reduce((sum, event) => sum + (event.registrationCount || 0), 0);
    const totalUsers = await User.countDocuments();

    res.json({
      events: eventsWithCounts,
      stats: {
        totalEvents: eventsWithCounts.length,
        totalRegistrations,
        upcomingEvents: upcomingEvents.length,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch admin dashboard data.' });
  }
});

// Get all events with filters and search
router.get('/', async (req, res) => {
  try {
    const { 
      q,           // search query
      types,       // comma-separated event types
      from,        // start date filter
      to,          // end date filter
      limit = 20,  // pagination limit
      page = 1     // pagination page
    } = req.query;

    // Build query
    const query = { visibility: 'public', isActive: true };

    // Search by title
    if (q) {
      query.title = { $regex: q, $options: 'i' };
    }

    // Filter by types
    if (types) {
      const typeArray = types.split(',').map(t => t.trim());
      query.type = { $in: typeArray };
    }

    // Date range filter
    if (from || to) {
      query.startAt = {};
      if (from) query.startAt.$gte = new Date(from);
      if (to) query.startAt.$lte = new Date(to);
    } else {
      // Default: show upcoming events and recent events (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.startAt = { $gte: sevenDaysAgo };
    }

    const skip = (page - 1) * limit;

    console.log('Fetching events with query:', query);

    const events = await Event.find(query)
      .populate('registrationCount')
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    console.log(`Found ${events.length} events matching query`);

    // Get registration count for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          status: { $in: ['registered', 'checked_in'] }
        });
        
        return {
          ...event,
          registrationCount,
          isFull: event.capacity ? registrationCount >= event.capacity : false
        };
      })
    );

    const total = await Event.countDocuments(query);

    console.log(`Returning ${eventsWithCounts.length} events with registration counts`);

    res.json({
      events: eventsWithCounts,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: eventsWithCounts.length,
        totalEvents: total
      }
    });
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch events. Please try again.' });
  }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    
    if (!event || !event.isActive) {
      return res.status(404).json({ message: 'Event not found 🤔' });
    }

    // Get registration count
    const registrationCount = await Registration.countDocuments({
      eventId: event._id,
      status: { $in: ['registered', 'checked_in'] }
    });

    res.json({
      ...event,
      registrationCount,
      isFull: event.capacity ? registrationCount >= event.capacity : false
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch event details.' });
  }
});

// Create new event (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.userId
    };

    console.log('Creating event with data:', {
      title: eventData.title,
      startAt: eventData.startAt,
      visibility: eventData.visibility,
      isActive: eventData.isActive,
      createdBy: eventData.createdBy
    });

    const event = new Event(eventData);
    await event.save();

    console.log('Event created successfully:', {
      id: event._id,
      title: event.title,
      startAt: event.startAt,
      visibility: event.visibility,
      isActive: event.isActive
    });

    res.status(201).json({
      message: 'Event created successfully! 🎉',
      event
    });
  } catch (error) {
    console.error('Event creation error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    
    res.status(500).json({ message: 'Failed to create event. Please try again.' });
  }
});

// Update event (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    // First get the existing event to compare dates
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updateData = req.body;

    // Validate start and end times
    if (updateData.startAt || updateData.endAt) {
      const startTime = new Date(updateData.startAt || existingEvent.startAt);
      const endTime = updateData.endAt ? new Date(updateData.endAt) : existingEvent.endAt;
      
      if (endTime && endTime <= startTime) {
        return res.status(400).json({ 
          message: 'Event end time must be after start time' 
        });
      }
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Event updated successfully! ✨',
      event
    });
  } catch (error) {
    console.error('Event update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    
    res.status(500).json({ message: 'Failed to update event. Please try again.' });
  }
});

// Delete event (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully! 🗑️' });
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({ message: 'Failed to delete event. Please try again.' });
  }
});

// Get events created by current user (admin dashboard)
router.get('/my/created', authenticate, async (req, res) => {
  try {
    const events = await Event.find({ 
      createdBy: req.userId, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .lean();

    // Add registration counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          status: { $in: ['registered', 'checked_in'] }
        });
        
        return { ...event, registrationCount };
      })
    );

    res.json({ events: eventsWithCounts });
  } catch (error) {
    console.error('My events fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch your events.' });
  }
});

export default router;
