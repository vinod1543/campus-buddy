import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true
    },
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Faculty']
    },
    major: {
      type: String,
      maxlength: [100, 'Major cannot exceed 100 characters'],
      trim: true
    },
    profilePicture: {
      type: String,
      default: null
    },
    interests: [{
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Academic', 'Clubs', 'Volunteering', 'technical', 'cultural', 'sports', 'academic', 'clubs', 'volunteering']
    }],
    emailReminders: {
      type: Boolean,
      default: true
    },
    notificationPreferences: {
      eventReminders: {
        type: Boolean,
        default: true
      },
      reminderTiming: [{
        type: String,
        enum: ['24h', '1h']
      }],
      marketingEmails: {
        type: Boolean,
        default: false
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

// Index for faster queries
UserSchema.index({ role: 1, isActive: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Normalize interests values before saving
UserSchema.pre('save', function(next) {
  // Set default notification preferences for new users
  if (this.isNew && !this.notificationPreferences) {
    this.notificationPreferences = {
      eventReminders: true,
      reminderTiming: ['24h', '1h'],
      marketingEmails: false
    };
  }
  
  // Handle empty year
  if (this.isModified('year') && this.year === '') {
    this.year = undefined;
  }
  
  // Handle interests normalization
  if (this.isModified('interests')) {
    const interestMapping = {
      'technical': 'Technical',
      'cultural': 'Cultural', 
      'sports': 'Sports',
      'academic': 'Academic',
      'clubs': 'Clubs',
      'volunteering': 'Volunteering'
    };
    
    this.interests = this.interests.map(interest => {
      const normalized = interestMapping[interest.toLowerCase()];
      return normalized || interest;
    });
  }
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
