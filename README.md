# Campus Event Buddy 🎉

A centralized web platform where students can discover, register for, and track campus events, and organizers can create and manage events efficiently.

## 🎯 Problem Statement

Students often miss campus events because information is scattered across WhatsApp groups, notice boards, and word of mouth. There's no centralized, searchable system to view and track events, leading to poor attendance and missed opportunities.

## 💡 Solution

Campus Event Buddy provides a unified platform featuring:
- **Event Discovery**: Browse and search upcoming campus events
- **Smart Registration**: One-click event registration with capacity tracking
- **Personal Dashboard**: Track your registered events in one place
- **Calendar Integration**: Direct Google Calendar integration
- **Email Reminders**: Automated 24-hour and 1-hour event reminders
- **Admin Tools**: Complete event management for organizers

## ✨ Features

### For Students
- 🔍 **Event Discovery**: Browse events with search and filter by type
- 📝 **Quick Registration**: Register for events with one click
- 📅 **Calendar Integration**: Add events directly to Google Calendar
- 📧 **Smart Reminders**: Get email notifications before events
- 🎯 **Personal Dashboard**: View all your registered events
- 👤 **Profile Management**: Set interests and notification preferences

### For Event Organizers
- ✏️ **Event Management**: Create, edit, and delete events
- 👥 **Participant Tracking**: View registered attendees and capacity
- 📊 **Dashboard**: Manage all events from one interface
- 🎪 **Event Types**: Support for technical, cultural, sports, academic, clubs, and volunteering events

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **React Router** for navigation
- **Axios** for API communication
- **Modern CSS** with responsive design
- **Progressive Web App** features

### Backend
- **Node.js** with Express framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication with refresh tokens
- **Nodemailer** for email services
- **node-cron** for scheduled reminders
- **Multer** for file uploads

### Services
- **Gmail SMTP** for reliable email delivery
- **Google Calendar** integration
- **MongoDB Atlas** for cloud database

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Gmail account with app password

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vinod1543/campus-buddy.git
   cd campus-buddy
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   Create `server/.env` file:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/campus-buddy
   # or use MongoDB Atlas
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-buddy

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-here

   # Email Configuration
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📧 Email Setup

To enable email reminders:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update .env** with your Gmail and app password

## 🎨 Design Principles

### Human-Centered Design
- Natural language and conversational tone
- Friendly micro-interactions and helpful messages
- Contextual help and smart defaults

### Modern & Minimal
- Clean typography with plenty of whitespace
- Subtle shadows and rounded corners
- Smooth transitions and hover effects
- Focused content hierarchy

### Accessibility First
- High contrast ratios for readability
- Clear focus states for keyboard navigation
- Mobile-first responsive design
- Semantic HTML structure

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Events
- `GET /api/events` - Get all events (with filters)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (admin only)
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Delete event (admin only)

### Registrations
- `POST /api/registrations` - Register for event
- `GET /api/registrations/my-events` - Get user's registered events
- `DELETE /api/registrations/:eventId` - Unregister from event
- `GET /api/registrations/event/:eventId` - Get event participants (admin only)

## 🗂️ Project Structure

```
campus-buddy/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS styles
│   │   ├── utils/          # Utility functions
│   │   ├── api.js          # API client
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # App entry point
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic services
│   │   ├── jobs/           # Scheduled jobs
│   │   └── index.js        # Server entry point
│   ├── uploads/            # File uploads directory
│   └── package.json        # Backend dependencies
└── README.md               # This file
```

## 🎯 User Roles

### Student
- Browse and search events
- Register/unregister for events
- View personal event dashboard
- Add events to calendar
- Receive email reminders
- Manage notification preferences

### Admin/Event Organizer
- All student capabilities
- Create, edit, and delete events
- Set event capacity and details
- View registered participants
- Manage event visibility

## 📅 Event Types

The platform supports various event categories:

- 🔧 **Technical** - Hackathons, coding workshops, tech talks
- 🎭 **Cultural** - Festivals, performances, art exhibitions
- ⚽ **Sports** - Tournaments, fitness events, sports competitions
- 📚 **Academic** - Seminars, conferences, study groups
- 🎪 **Clubs** - Club meetings, social gatherings, hobby groups
- 🤝 **Volunteering** - Community service, charity events, social causes

## 🔔 Notification System

### Email Reminders
- **24-hour reminder**: Sent daily at scheduled times
- **1-hour reminder**: Sent 15 minutes before each hour
- **Welcome emails**: Sent upon successful registration
- **Personalized content**: Includes event details and calendar links

### Preferences
- Toggle email reminders on/off
- Choose reminder timing (24h, 1h, or both)
- Opt-out of marketing emails

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Event creation and management
- [ ] Event registration flow
- [ ] Email reminder delivery
- [ ] Calendar integration
- [ ] Mobile responsiveness
- [ ] Admin dashboard functionality

### Test Accounts
Create test accounts with different roles:
```bash
# Student account
Email: student@test.com
Role: student

# Admin account  
Email: admin@test.com
Role: admin
```

## 🚀 Deployment

### Frontend (Client)
1. Build the production version:
   ```bash
   cd client
   npm run build
   ```
2. Deploy `dist/` folder to services like:
   - Netlify
   - Vercel
   - GitHub Pages

### Backend (Server)
1. Set production environment variables
2. Deploy to services like:
   - Railway
   - Render
   - AWS EC2
   - Digital Ocean

### Database
- Use MongoDB Atlas for production
- Ensure proper indexes for performance
- Set up automated backups

## 🛡️ Security

- JWT tokens with expiration
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- Rate limiting (recommended for production)
- Environment variable protection

## 🔧 Maintenance

### Scheduled Jobs
- **Event reminders**: Automated email sending
- **Cleanup tasks**: Remove expired events and old notifications
- **Database optimization**: Regular index maintenance

### Monitoring
- Server health checks
- Email delivery status
- Database performance
- User activity metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React and Vite teams for excellent development tools
- MongoDB team for the robust database platform
- Nodemailer contributors for reliable email service
- The open-source community for inspiration and support

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check existing documentation
- Review the troubleshooting guide

---

**Made with ❤️ for the campus community**

*Campus Event Buddy - Never miss another campus event!*
