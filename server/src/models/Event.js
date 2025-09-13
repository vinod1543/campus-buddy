import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: ['technical', 'cultural', 'sports', 'academic', 'club']
    },
    startAt: {
      type: Date,
      required: [true, 'Event start time is required']
      // Removed the future date validation to allow more flexibility
      // Admin can create events with different dates for testing/demo purposes
    },
    endAt: {
      type: Date
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [100, 'Venue cannot exceed 100 characters']
    },
    organizer: {
      type: String,
      trim: true,
      maxlength: [100, 'Organizer name cannot exceed 100 characters']
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      max: [10000, 'Capacity cannot exceed 10,000']
    },
    registrationUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Registration URL must be a valid URL']
    },
    posterUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Poster URL must be a valid URL']
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
EventSchema.index({ startAt: 1, visibility: 1, isActive: 1 });
EventSchema.index({ type: 1, startAt: 1 });
EventSchema.index({ createdBy: 1 });

// Virtual for registration count
EventSchema.virtual('registrationCount', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'eventId',
  count: true,
  match: { status: 'registered' }
});

// Virtual to check if event is full
EventSchema.virtual('isFull').get(function() {
  if (!this.capacity) return false;
  return this.registrationCount >= this.capacity;
});

// Virtual for formatted date
EventSchema.virtual('formattedStartAt').get(function() {
  return this.startAt?.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

export default mongoose.model('Event', EventSchema);
