const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { sendAppointmentReminder } = require('./emailService');

/**
 * Scheduled Jobs Service
 * Handles automated tasks like sending appointment reminders
 */

// Check if a date is tomorrow
const isTomorrow = (date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const appointmentDate = new Date(date);
  
  return (
    appointmentDate.getDate() === tomorrow.getDate() &&
    appointmentDate.getMonth() === tomorrow.getMonth() &&
    appointmentDate.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Send appointment reminders for appointments scheduled tomorrow
 * Runs daily at 9:00 AM
 */
const sendDailyReminders = async () => {
  try {
    console.log('🔄 Running daily appointment reminder job...');

    // Get all approved appointments
    const appointments = await Appointment.find({
      status: 'approved',
    })
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name',
        },
      });

    // Filter appointments for tomorrow
    const tomorrowAppointments = appointments.filter((appointment) =>
      isTomorrow(appointment.appointmentDate)
    );

    console.log(`📧 Found ${tomorrowAppointments.length} appointments for tomorrow`);

    let successCount = 0;
    let failCount = 0;

    // Send reminders
    for (const appointment of tomorrowAppointments) {
      try {
        const patient = appointment.patientId;
        const doctor = appointment.doctorId;
        const doctorUser = doctor.userId;

        const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        await sendAppointmentReminder(patient.email, {
          patientName: patient.name,
          doctorName: doctorUser.name,
          date: formattedDate,
          time: appointment.timeSlot,
          hospital: doctor.hospital,
        });

        successCount++;
        console.log(`✅ Reminder sent to ${patient.email}`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to send reminder for appointment ${appointment._id}:`, error.message);
      }
    }

    console.log(`✨ Reminder job completed: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('❌ Error in daily reminder job:', error);
  }
};

/**
 * Clean up old cancelled/rejected appointments
 * Runs weekly on Sunday at 2:00 AM
 */
const cleanupOldAppointments = async () => {
  try {
    console.log('🔄 Running cleanup job for old appointments...');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await Appointment.deleteMany({
      status: { $in: ['cancelled', 'rejected'] },
      updatedAt: { $lt: sixMonthsAgo },
    });

    console.log(`✨ Cleanup completed: ${result.deletedCount} old appointments removed`);
  } catch (error) {
    console.error('❌ Error in cleanup job:', error);
  }
};

/**
 * Auto-complete past appointments
 * Runs daily at midnight to mark past approved appointments as completed
 */
const autoCompletePastAppointments = async () => {
  try {
    console.log('🔄 Running auto-complete job for past appointments...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const result = await Appointment.updateMany(
      {
        status: 'approved',
        appointmentDate: { $lt: yesterday },
      },
      {
        $set: { status: 'completed' },
      }
    );

    console.log(`✨ Auto-complete job done: ${result.modifiedCount} appointments marked as completed`);
  } catch (error) {
    console.error('❌ Error in auto-complete job:', error);
  }
};

/**
 * Send weekly summary to doctors
 * Runs every Monday at 8:00 AM
 */
const sendWeeklySummary = async () => {
  try {
    console.log('🔄 Running weekly summary job...');

    // Get all active doctors
    const doctors = await Doctor.find({ isActive: true }).populate('userId', 'name email');

    for (const doctor of doctors) {
      try {
        // Get upcoming appointments for this week
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingAppointments = await Appointment.find({
          doctorId: doctor._id,
          status: { $in: ['pending', 'approved'] },
          appointmentDate: {
            $gte: today,
            $lte: nextWeek,
          },
        }).populate('patientId', 'name');

        // Get statistics
        const pendingCount = upcomingAppointments.filter(a => a.status === 'pending').length;
        const approvedCount = upcomingAppointments.filter(a => a.status === 'approved').length;

        console.log(`📊 Dr. ${doctor.userId.name}: ${pendingCount} pending, ${approvedCount} approved appointments`);
        
        // Note: You can implement sendWeeklySummaryEmail in emailService.js
        // await sendWeeklySummaryEmail(doctor.userId.email, { ... });
      } catch (error) {
        console.error(`❌ Failed to send summary to ${doctor.userId.email}:`, error.message);
      }
    }

    console.log('✨ Weekly summary job completed');
  } catch (error) {
    console.error('❌ Error in weekly summary job:', error);
  }
};

/**
 * Initialize all scheduled jobs
 */
const initScheduledJobs = () => {
  console.log('⚙️  Initializing scheduled jobs...');

  // Send appointment reminders daily at 9:00 AM
  cron.schedule('0 9 * * *', sendDailyReminders, {
    scheduled: true,
    timezone: 'America/New_York', // Change to your timezone
  });
  console.log('✓ Daily reminder job scheduled (9:00 AM)');

  // Auto-complete past appointments daily at midnight
  cron.schedule('0 0 * * *', autoCompletePastAppointments, {
    scheduled: true,
    timezone: 'America/New_York',
  });
  console.log('✓ Auto-complete job scheduled (midnight)');

  // Clean up old appointments weekly on Sunday at 2:00 AM
  cron.schedule('0 2 * * 0', cleanupOldAppointments, {
    scheduled: true,
    timezone: 'America/New_York',
  });
  console.log('✓ Cleanup job scheduled (Sunday 2:00 AM)');

  // Send weekly summary every Monday at 8:00 AM
  cron.schedule('0 8 * * 1', sendWeeklySummary, {
    scheduled: true,
    timezone: 'America/New_York',
  });
  console.log('✓ Weekly summary job scheduled (Monday 8:00 AM)');

  console.log('✨ All scheduled jobs initialized successfully!');

  // For testing purposes, you can run jobs immediately
  if (process.env.NODE_ENV === 'development' && process.env.RUN_JOBS_ON_STARTUP === 'true') {
    console.log('🧪 Running jobs immediately for testing...');
    setTimeout(() => {
      sendDailyReminders();
    }, 5000); // Run after 5 seconds
  }
};

/**
 * Manual trigger functions for testing or admin actions
 */
const manualTriggers = {
  sendDailyReminders,
  cleanupOldAppointments,
  autoCompletePastAppointments,
  sendWeeklySummary,
};

module.exports = {
  initScheduledJobs,
  manualTriggers,
};
