import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration failed:', error);
    return false;
  }
};

// Generate HTML email template for reminders
const generateReminderTemplate = (user, event, timeUntilEvent) => {
  const eventDate = new Date(event.startAt);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const getEventTypeEmoji = (type) => {
    const emojis = {
      technical: '🔧',
      cultural: '🎭',
      sports: '⚽',
      academic: '📚',
      club: '🎪'
    };
    return emojis[type] || '📅';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Event Reminder - ${event.title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
        }
        .content {
          padding: 2rem;
        }
        .event-card {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1rem 0;
          border-left: 4px solid #667eea;
        }
        .event-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #2d3748;
        }
        .event-type {
          display: inline-block;
          background-color: #667eea;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: capitalize;
          margin-bottom: 1rem;
        }
        .event-details {
          margin: 1rem 0;
        }
        .detail-item {
          margin: 0.5rem 0;
          display: flex;
          align-items: center;
        }
        .detail-icon {
          margin-right: 0.5rem;
          font-size: 1.1rem;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 1rem 0;
          text-align: center;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
          color: #6c757d;
          border-top: 1px solid #e9ecef;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content {
            padding: 1.5rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Event Reminder</h1>
          <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Don't miss your upcoming campus event!</p>
        </div>
        
        <div class="content">
          <p>Hi <strong>${user.name}</strong>,</p>
          
          <p>This is a friendly reminder that you're registered for an event happening <strong>${timeUntilEvent}</strong>!</p>
          
          <div class="event-card">
            <div class="event-title">${getEventTypeEmoji(event.type)} ${event.title}</div>
            <div class="event-type">${event.type}</div>
            
            <div class="event-details">
              <div class="detail-item">
                <span class="detail-icon">📅</span>
                <strong>When:</strong> ${formattedDate} at ${formattedTime}
              </div>
              <div class="detail-item">
                <span class="detail-icon">📍</span>
                <strong>Where:</strong> ${event.venue}
              </div>
              ${event.organizer ? `
                <div class="detail-item">
                  <span class="detail-icon">👥</span>
                  <strong>Organizer:</strong> ${event.organizer}
                </div>
              ` : ''}
            </div>
            
            ${event.description ? `
              <div style="margin-top: 1rem;">
                <strong>About this event:</strong>
                <p style="margin: 0.5rem 0; color: #555;">${event.description}</p>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${event._id}" class="cta-button">
              📋 View Event Details
            </a>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 1rem; border-radius: 8px; margin-top: 1.5rem;">
            <p style="margin: 0; font-size: 0.9rem; color: #1565c0;">
              💡 <strong>Pro tip:</strong> Add this event to your calendar to stay organized!
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>This reminder was sent from <strong>Campus Event Buddy</strong></p>
          <p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile">Update your notification preferences</a> | 
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/my-events">View My Events</a>
          </p>
          <p style="font-size: 0.8rem; margin-top: 1rem;">
            You're receiving this because you registered for this event. 
            Manage your notifications in your profile settings.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send event reminder email
export const sendEventReminder = async (user, event, timeUntilEvent) => {
  try {
    const transporter = createTransporter();
    
    const eventDate = new Date(event.startAt);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: {
        name: 'Campus Event Buddy',
        address: process.env.SMTP_USER
      },
      to: user.email,
      subject: `🔔 Reminder: ${event.title} ${timeUntilEvent}`,
      html: generateReminderTemplate(user, event, timeUntilEvent),
      text: `Hi ${user.name},

This is a reminder that you're registered for "${event.title}" happening ${timeUntilEvent}.

Event Details:
📅 When: ${formattedDate}
📍 Where: ${event.venue}
${event.organizer ? `👥 Organizer: ${event.organizer}` : ''}

${event.description ? `About: ${event.description}` : ''}

View full details: ${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${event._id}

Best regards,
Campus Event Buddy Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent to ${user.email} for event: ${event.title}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send reminder email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Campus Event Buddy',
        address: process.env.SMTP_USER
      },
      to: user.email,
      subject: '🎉 Welcome to Campus Event Buddy!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 8px; }
            .content { padding: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Campus Event Buddy!</h1>
              <p>Your gateway to amazing campus events</p>
            </div>
            <div class="content">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>Welcome to Campus Event Buddy! We're excited to help you discover and never miss another campus event.</p>
              
              <h3>What you can do now:</h3>
              <ul>
                <li>🔍 Browse upcoming campus events</li>
                <li>🎯 Register for events that interest you</li>
                <li>📅 Add events to your calendar</li>
                <li>🔔 Get email reminders before your events</li>
                <li>👤 Complete your profile for better recommendations</li>
              </ul>
              
              <div style="text-align: center; margin: 2rem 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/events" class="button">
                  🎪 Start Exploring Events
                </a>
              </div>
              
              <p>Happy event hunting!</p>
              <p>The Campus Event Buddy Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Campus Event Buddy, ${user.name}!

We're excited to help you discover amazing campus events.

Start exploring: ${process.env.CLIENT_URL || 'http://localhost:5173'}/events

Best regards,
Campus Event Buddy Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${user.email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  verifyEmailConfig,
  sendEventReminder,
  sendWelcomeEmail
};
