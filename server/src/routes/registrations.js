import { Router } from 'express';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
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
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Register for an event
router.post('/', authenticate, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.userId;

    console.log('Registration attempt:', { eventId, userId });

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Check if event exists and is active
    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      console.log('Event not found or inactive:', { eventId, found: !!event, isActive: event?.isActive });
      return res.status(404).json({ message: 'Event not found or no longer available' });
    }

    // Check if event registration is still allowed
    const eventStart = new Date(event.startAt);
    const now = new Date();
    
    console.log('Time validation:', {
      eventTitle: event.title,
      eventStart: eventStart.toISOString(),
      currentTime: now.toISOString(),
      canRegister: now < eventStart,
      timeUntilEvent: Math.round((eventStart - now) / (1000 * 60)) + ' minutes'
    });
    
    // Allow registration if event hasn't started yet
    if (now >= eventStart) {
      console.log('Registration blocked - event already started');
      return res.status(400).json({ 
        message: 'Registration is closed. This event has already started.' 
      });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({ eventId, userId });
    if (existingRegistration && existingRegistration.status !== 'cancelled') {
      return res.status(400).json({ 
        message: 'You\'re already registered for this event! 🎟️' 
      });
    }

    // Check event capacity
    if (event.capacity) {
      const currentRegistrations = await Registration.countDocuments({
        eventId,
        status: { $in: ['registered', 'checked_in'] }
      });

      if (currentRegistrations >= event.capacity) {
        return res.status(400).json({ 
          message: 'Sorry, this event is full! 😔 Keep an eye out for more events.' 
        });
      }
    }

    // Create registration
    const registration = new Registration({
      eventId,
      userId,
      status: 'registered'
    });

    await registration.save();

    // Populate event details for response
    await registration.populate('event', 'title startAt venue organizer');

    res.status(201).json({
      message: `You're all set for ${registration.event.title}! 🎉 We'll remind you soon.`,
      registration
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'You\'re already registered for this event!' 
      });
    }
    
    res.status(500).json({ message: 'Failed to register for event. Please try again.' });
  }
});

// Get user's registrations (My Events)
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { status = 'all', upcoming = 'true' } = req.query;

    // Build query
    const query = { userId };
    
    if (status !== 'all') {
      query.status = status;
    }

    let registrations = await Registration.find(query)
      .populate({
        path: 'event',
        select: 'title description type startAt endAt venue organizer posterUrl',
        match: upcoming === 'true' ? { startAt: { $gte: new Date() }, isActive: true } : { isActive: true }
      })
      .sort({ 'event.startAt': 1 })
      .lean();

    // Filter out registrations where event was not found (due to populate match)
    registrations = registrations.filter(reg => reg.event);

    res.json({ 
      registrations,
      count: registrations.length,
      message: registrations.length === 0 
        ? 'No events yet! Browse some amazing events and register. 🎪' 
        : `You have ${registrations.length} registered events! 🎟️`
    });
  } catch (error) {
    console.error('My registrations fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch your events.' });
  }
});

// Cancel registration
router.delete('/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.userId;

    const registration = await Registration.findOne({ eventId, userId });
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration already cancelled' });
    }

    // Update status instead of deleting to maintain records
    registration.status = 'cancelled';
    await registration.save();

    await registration.populate('event', 'title');

    res.json({
      message: `Registration cancelled for ${registration.event.title}. Hope to see you at other events! 👋`,
      registration
    });
  } catch (error) {
    console.error('Registration cancellation error:', error);
    res.status(500).json({ message: 'Failed to cancel registration. Please try again.' });
  }
});

// Get registrations for a specific event (admin use)
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status = 'registered' } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrations = await Registration.find({ 
      eventId, 
      status: status === 'all' ? { $ne: 'cancelled' } : status 
    })
    .populate('user', 'name email')
    .sort({ registeredAt: -1 })
    .lean();

    res.json({
      registrations,
      count: registrations.length,
      event: {
        id: event._id,
        title: event.title,
        capacity: event.capacity
      }
    });
  } catch (error) {
    console.error('Event registrations fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch event registrations.' });
  }
});

// Check if user is registered for an event
router.get('/check/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.userId;

    const registration = await Registration.findOne({ 
      eventId, 
      userId, 
      status: { $in: ['registered', 'checked_in'] } 
    });

    res.json({
      isRegistered: !!registration,
      registration: registration || null
    });
  } catch (error) {
    console.error('Registration check error:', error);
    res.status(500).json({ message: 'Failed to check registration status.' });
  }
});

export default router;
