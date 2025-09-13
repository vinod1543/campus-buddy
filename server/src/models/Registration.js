import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['registered', 'checked_in', 'cancelled'],
      default: 'registered'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    '24hReminderSent': {
      type: Boolean,
      default: false
    },
    '1hReminderSent': {
      type: Boolean,
      default: false
    },
    '24hReminderSentAt': {
      type: Date
    },
    '1hReminderSentAt': {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index to ensure unique registration per user per event
RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Index for finding registrations by status
RegistrationSchema.index({ status: 1, eventId: 1 });

// Index for reminder jobs
RegistrationSchema.index({ reminderSent: 1, status: 1 });

// Virtual to populate event details
RegistrationSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate user details
RegistrationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to check if registration is active
RegistrationSchema.methods.isActive = function() {
  return this.status === 'registered' || this.status === 'checked_in';
};

// Static method to find active registrations for an event
RegistrationSchema.statics.findActiveForEvent = function(eventId) {
  return this.find({ 
    eventId, 
    status: { $in: ['registered', 'checked_in'] } 
  }).populate('user', 'name email');
};

// Static method to find user's upcoming events
RegistrationSchema.statics.findUpcomingForUser = function(userId) {
  return this.find({ 
    userId, 
    status: { $in: ['registered', 'checked_in'] } 
  }).populate({
    path: 'event',
    match: { startAt: { $gte: new Date() }, isActive: true },
    select: 'title description type startAt endAt venue organizer'
  });
};

export default mongoose.model('Registration', RegistrationSchema);
