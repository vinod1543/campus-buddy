import cron from 'node-cron';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import { sendEventReminder } from '../services/emailService.js';

class ReminderJobs {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  // Start all reminder jobs
  start() {
    if (this.isRunning) {
      console.log('⚠️ Reminder jobs are already running');
      return;
    }

    console.log('🚀 Starting reminder job scheduler...');

    // Job 1: Send 24-hour reminders (runs every hour)
    const job24h = cron.schedule('0 * * * *', async () => {
      await this.send24HourReminders();
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta' // Adjust to your timezone
    });

    // Job 2: Send 1-hour reminders (runs every 15 minutes)
    const job1h = cron.schedule('*/15 * * * *', async () => {
      await this.send1HourReminders();
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta' // Adjust to your timezone
    });

    // Job 3: Daily cleanup (runs daily at 2 AM)
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldReminders();
    }, {
      scheduled: false,
      timezone: 'Asia/Jakarta'
    });

    // Start all jobs
    job24h.start();
    job1h.start();
    cleanupJob.start();

    this.jobs = [job24h, job1h, cleanupJob];
    this.isRunning = true;

    console.log('✅ Reminder jobs started successfully');
    console.log('📧 24-hour reminders: Every hour on the hour');
    console.log('📧 1-hour reminders: Every 15 minutes');
    console.log('🧹 Cleanup job: Daily at 2:00 AM');
  }

  // Stop all jobs
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Reminder jobs are not running');
      return;
    }

    this.jobs.forEach(job => job.destroy());
    this.jobs = [];
    this.isRunning = false;
    console.log('🛑 Reminder jobs stopped');
  }

  // Send 24-hour reminders
  async send24HourReminders() {
    try {
      console.log('🔄 Checking for 24-hour reminders...');

      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

      // Find events starting in approximately 24 hours
      const upcomingEvents = await Event.find({
        startAt: {
          $gte: twentyThreeHoursFromNow,
          $lte: twentyFourHoursFromNow
        },
        isActive: true,
        visibility: 'public'
      }).lean();

      console.log(`📅 Found ${upcomingEvents.length} events needing 24-hour reminders`);

      for (const event of upcomingEvents) {
        await this.sendRemindersForEvent(event, '24h', 'in 24 hours');
      }

    } catch (error) {
      console.error('❌ Error sending 24-hour reminders:', error);
    }
  }

  // Send 1-hour reminders
  async send1HourReminders() {
    try {
      console.log('🔄 Checking for 1-hour reminders...');

      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const fortyFiveMinutesFromNow = new Date(now.getTime() + 45 * 60 * 1000);

      // Find events starting in approximately 1 hour
      const upcomingEvents = await Event.find({
        startAt: {
          $gte: fortyFiveMinutesFromNow,
          $lte: oneHourFromNow
        },
        isActive: true,
        visibility: 'public'
      }).lean();

      console.log(`📅 Found ${upcomingEvents.length} events needing 1-hour reminders`);

      for (const event of upcomingEvents) {
        await this.sendRemindersForEvent(event, '1h', 'in 1 hour');
      }

    } catch (error) {
      console.error('❌ Error sending 1-hour reminders:', error);
    }
  }

  // Send reminders for a specific event
  async sendRemindersForEvent(event, reminderType, timeDescription) {
    try {
      // Find all active registrations for this event
      const registrations = await Registration.find({
        eventId: event._id,
        status: { $in: ['registered', 'checked_in'] }
      }).populate({
        path: 'userId',
        select: 'name email emailReminders notificationPreferences',
        match: { isActive: true }
      }).lean();

      // Filter out registrations where user wasn't found or has disabled emails
      const validRegistrations = registrations.filter(reg => 
        reg.userId && 
        reg.userId.emailReminders !== false
      );

      console.log(`📧 Sending ${reminderType} reminders to ${validRegistrations.length} users for "${event.title}"`);

      let successCount = 0;
      let failureCount = 0;

      for (const registration of validRegistrations) {
        try {
          // Check if reminder already sent for this type
          const reminderKey = `${reminderType}ReminderSent`;
          if (registration[reminderKey]) {
            console.log(`⏭️ ${reminderType} reminder already sent to ${registration.userId.email}`);
            continue;
          }

          // Send email reminder
          const result = await sendEventReminder(
            registration.userId,
            event,
            timeDescription
          );

          if (result.success) {
            // Mark reminder as sent
            await Registration.findByIdAndUpdate(registration._id, {
              [`${reminderKey}`]: true,
              [`${reminderKey}At`]: new Date()
            });
            successCount++;
          } else {
            failureCount++;
            console.error(`❌ Failed to send ${reminderType} reminder to ${registration.userId.email}:`, result.error);
          }

          // Add small delay to avoid rate limiting
          await this.sleep(100);

        } catch (error) {
          failureCount++;
          console.error(`❌ Error sending ${reminderType} reminder to ${registration.userId.email}:`, error);
        }
      }

      console.log(`✅ ${reminderType} reminders for "${event.title}": ${successCount} sent, ${failureCount} failed`);

    } catch (error) {
      console.error(`❌ Error processing ${reminderType} reminders for event ${event._id}:`, error);
    }
  }

  // Clean up old reminder flags for past events
  async cleanupOldReminders() {
    try {
      console.log('🧹 Cleaning up old reminder data...');

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      // Find registrations for events that ended more than 3 days ago
      const oldRegistrations = await Registration.find({})
        .populate({
          path: 'eventId',
          match: { 
            startAt: { $lt: threeDaysAgo },
            isActive: true 
          }
        })
        .lean();

      const registrationsToClean = oldRegistrations.filter(reg => reg.eventId);

      if (registrationsToClean.length > 0) {
        // Reset reminder flags for old events
        const registrationIds = registrationsToClean.map(reg => reg._id);
        
        await Registration.updateMany(
          { _id: { $in: registrationIds } },
          {
            $unset: {
              '24hReminderSent': 1,
              '1hReminderSent': 1,
              '24hReminderSentAt': 1,
              '1hReminderSentAt': 1
            }
          }
        );

        console.log(`🧹 Cleaned up reminder data for ${registrationsToClean.length} old registrations`);
      } else {
        console.log('🧹 No old reminder data to clean up');
      }

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger for testing
  async sendTestReminders() {
    console.log('🧪 Running test reminder check...');
    await this.send24HourReminders();
    await this.send1HourReminders();
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.length,
      nextRun: {
        hourly: this.isRunning ? 'Every hour' : 'Stopped',
        quarterly: this.isRunning ? 'Every 15 minutes' : 'Stopped',
        daily: this.isRunning ? 'Daily at 2:00 AM' : 'Stopped'
      }
    };
  }
}

// Create singleton instance
const reminderJobs = new ReminderJobs();

export default reminderJobs;
