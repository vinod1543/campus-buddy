import { Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', interests = [] } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'That email is already registered! Try signing in instead.' 
      });
    }

    // Create new user
    const user = new User({ name, email, password, role, interests });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email (don't wait for it to complete)
    sendWelcomeEmail(user).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    res.status(201).json({
      message: `Welcome to Campus Buddy, ${user.name}! 🎉`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    
    res.status(500).json({ message: 'Something went wrong during registration. Please try again.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide both email and password.' 
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email, isActive: true }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        message: 'Invalid email or password. Please try again.' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: `Welcome back, ${user.name}! 👋`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong during login. Please try again.' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        year: user.year,
        major: user.major,
        interests: user.interests,
        profilePicture: user.profilePicture,
        emailReminders: user.emailReminders,
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, email, bio, year, major, interests } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: decoded.userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: 'That email is already taken by another user.' 
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (year !== undefined && year !== '') updateData.year = year;
    if (major !== undefined) updateData.major = major;
    
    // Normalize interests before updating
    if (interests !== undefined) {
      const interestMapping = {
        'technical': 'Technical',
        'cultural': 'Cultural', 
        'sports': 'Sports',
        'academic': 'Academic',
        'club': 'Clubs',
        'volunteering': 'Volunteering'
      };
      
      updateData.interests = interests.map(interest => {
        const normalized = interestMapping[interest.toLowerCase()];
        return normalized || interest;
      });
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully! ✨',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        year: user.year,
        major: user.major,
        interests: user.interests,
        profilePicture: user.profilePicture,
        emailReminders: user.emailReminders,
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    
    res.status(500).json({ message: 'Failed to update profile. Please try again.' });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Both current and new passwords are required.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long.' 
      });
    }

    // Find user with password field
    const user = await User.findById(decoded.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: 'Current password is incorrect.' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully! 🔐'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password. Please try again.' });
  }
});

// Clear user interests
router.put('/clear-interests', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { interests: [] },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Interests cleared successfully! 🧹',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        year: user.year,
        major: user.major,
        interests: user.interests,
        profilePicture: user.profilePicture,
        emailReminders: user.emailReminders,
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Clear interests error:', error);
    res.status(500).json({ message: 'Failed to clear interests. Please try again.' });
  }
});

// Update notification preferences
router.put('/notification-preferences', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { emailReminders, notificationPreferences } = req.body;

    const updateData = {};
    if (emailReminders !== undefined) updateData.emailReminders = emailReminders;
    if (notificationPreferences !== undefined) updateData.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Notification preferences updated successfully! 🔔',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        year: user.year,
        major: user.major,
        interests: user.interests,
        profilePicture: user.profilePicture,
        emailReminders: user.emailReminders,
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Notification preferences update error:', error);
    res.status(500).json({ message: 'Failed to update notification preferences. Please try again.' });
  }
});

// Upload profile picture
router.post('/upload-profile-picture', auth, (req, res, next) => {
  upload.single('profilePicture')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file);
    console.log('User ID:', req.user.id);

    // Delete old profile picture if it exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profilePicture) {
      const oldFilePath = path.join(__dirname, '../../uploads/profile-pictures', path.basename(user.profilePicture));
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Deleted old profile picture:', oldFilePath);
        }
      } catch (error) {
        console.warn('Failed to delete old profile picture:', error);
      }
    }

    // Generate the URL for the uploaded file
    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
    console.log('New profile picture URL:', profilePictureUrl);

    // Update user with new profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePictureUrl },
      { new: true, runValidators: true }
    );

    console.log('User updated with profile picture');

    res.json({
      message: 'Profile picture uploaded successfully! 📸',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        year: updatedUser.year,
        major: updatedUser.major,
        interests: updatedUser.interests,
        profilePicture: updatedUser.profilePicture,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    
    // Clean up uploaded file if database update fails
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up uploaded file due to error');
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({ message: 'Failed to upload profile picture. Please try again.' });
  }
});

// Delete profile picture
router.delete('/delete-profile-picture', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the file from filesystem
    if (user.profilePicture) {
      const filePath = path.join(__dirname, '../../uploads/profile-pictures', path.basename(user.profilePicture));
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn('Failed to delete profile picture file:', error);
      }
    }

    // Update user to remove profile picture
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { profilePicture: null },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile picture deleted successfully! 🗑️',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        year: updatedUser.year,
        major: updatedUser.major,
        interests: updatedUser.interests,
        profilePicture: updatedUser.profilePicture,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ message: 'Failed to delete profile picture. Please try again.' });
  }
});

export default router;
