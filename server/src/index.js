import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_buddy';
try {
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
} catch (error) {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
}

// Import models
import './models/User.js';
import './models/Event.js';
import './models/Registration.js';

// Import and initialize services
import { verifyEmailConfig } from './services/emailService.js';
import reminderJobs from './jobs/reminderJobs.js';

// Import routes
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import registrationRoutes from './routes/registrations.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Campus Buddy API is running! 🎓',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong! 😅',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found 🤔' });
});

// Initialize services after successful setup
const initializeServices = async () => {
  try {
    // Verify email configuration
    const emailConfigured = await verifyEmailConfig();
    if (emailConfigured) {
      // Start reminder jobs
      reminderJobs.start();
    } else {
      console.log('⚠️ Email reminders disabled due to configuration issues');
    }
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
};

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Campus Buddy API running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize services after server starts
  initializeServices();
});
