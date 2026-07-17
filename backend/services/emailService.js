const nodemailer = require('nodemailer');

/**
 * Email Service for sending appointment notifications
 * Supports multiple email providers through environment configuration
 */

// Create reusable transporter
const createTransporter = () => {
  // Development: Use Ethereal email (fake SMTP service)
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST) {
    console.log('⚠️  Using Ethereal email for development. Configure EMAIL_HOST for production.');
    // Note: In production, you should set up real email credentials
    // For now, we'll create a test account on first use
    return null; // Will be created dynamically
  }

  // Production: Use configured SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

let transporter = createTransporter();

/**
 * Send email with error handling
 */
const sendEmail = async (mailOptions) => {
  try {
    // Create test account if in development without credentials
    if (!transporter) {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Healthcare Appointment" <noreply@healthcare.com>',
      ...mailOptions,
    });

    // Log preview URL for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email Templates
 */

// Appointment Confirmation Email
const sendAppointmentConfirmation = async (userEmail, appointmentDetails) => {
  const { patientName, doctorName, date, time, hospital, specialization } = appointmentDetails;

  const mailOptions = {
    to: userEmail,
    subject: '✅ Appointment Confirmed - Healthcare System',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Appointment Confirmed</h1>
            </div>
            <div class="content">
              <p>Dear ${patientName},</p>
              <p>Your appointment has been successfully confirmed. Please find the details below:</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">👨‍⚕️ Doctor:</span> Dr. ${doctorName}
                </div>
                <div class="detail-row">
                  <span class="label">🏥 Hospital:</span> ${hospital}
                </div>
                <div class="detail-row">
                  <span class="label">🩺 Specialization:</span> ${specialization}
                </div>
                <div class="detail-row">
                  <span class="label">📅 Date:</span> ${date}
                </div>
                <div class="detail-row">
                  <span class="label">🕐 Time:</span> ${time}
                </div>
              </div>
              
              <p><strong>Important Reminders:</strong></p>
              <ul>
                <li>Please arrive 15 minutes before your scheduled time</li>
                <li>Bring your ID and any relevant medical records</li>
                <li>If you need to reschedule, please do so at least 24 hours in advance</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/patient/appointments" class="button">View My Appointments</a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Healthcare Appointment System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Appointment Confirmed
      
      Dear ${patientName},
      
      Your appointment has been successfully confirmed.
      
      Details:
      Doctor: Dr. ${doctorName}
      Hospital: ${hospital}
      Specialization: ${specialization}
      Date: ${date}
      Time: ${time}
      
      Please arrive 15 minutes before your scheduled time.
      Bring your ID and any relevant medical records.
      
      View your appointments: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/patient/appointments
    `,
  };

  return await sendEmail(mailOptions);
};

// Appointment Reminder Email (24 hours before)
const sendAppointmentReminder = async (userEmail, appointmentDetails) => {
  const { patientName, doctorName, date, time, hospital } = appointmentDetails;

  const mailOptions = {
    to: userEmail,
    subject: '⏰ Appointment Reminder - Tomorrow',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reminder-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Appointment Reminder</h1>
            </div>
            <div class="content">
              <div class="reminder-box">
                <h2 style="margin-top: 0; color: #856404;">⚠️ Your appointment is tomorrow!</h2>
                <p style="margin: 0; color: #856404;">Please don't forget your scheduled appointment.</p>
              </div>
              
              <p>Dear ${patientName},</p>
              <p>This is a friendly reminder about your upcoming appointment:</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">👨‍⚕️ Doctor:</span> Dr. ${doctorName}
                </div>
                <div class="detail-row">
                  <span class="label">🏥 Hospital:</span> ${hospital}
                </div>
                <div class="detail-row">
                  <span class="label">📅 Date:</span> ${date}
                </div>
                <div class="detail-row">
                  <span class="label">🕐 Time:</span> ${time}
                </div>
              </div>
              
              <p><strong>Checklist:</strong></p>
              <ul>
                <li>✓ Arrive 15 minutes early</li>
                <li>✓ Bring your ID</li>
                <li>✓ Bring medical records if applicable</li>
                <li>✓ Prepare any questions for the doctor</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Appointment Reminder
      
      Dear ${patientName},
      
      This is a reminder about your appointment tomorrow:
      
      Doctor: Dr. ${doctorName}
      Hospital: ${hospital}
      Date: ${date}
      Time: ${time}
      
      Please arrive 15 minutes early and bring your ID.
    `,
  };

  return await sendEmail(mailOptions);
};

// Appointment Status Update Email
const sendAppointmentStatusUpdate = async (userEmail, appointmentDetails) => {
  const { patientName, doctorName, status, date, time, rejectionReason } = appointmentDetails;

  let statusColor, statusText, statusEmoji;
  
  switch (status) {
    case 'approved':
      statusColor = '#28a745';
      statusText = 'Approved';
      statusEmoji = '✅';
      break;
    case 'rejected':
      statusColor = '#dc3545';
      statusText = 'Rejected';
      statusEmoji = '❌';
      break;
    case 'completed':
      statusColor = '#17a2b8';
      statusText = 'Completed';
      statusEmoji = '✓';
      break;
    case 'cancelled':
      statusColor = '#ffc107';
      statusText = 'Cancelled';
      statusEmoji = '⚠️';
      break;
    default:
      statusColor = '#6c757d';
      statusText = status;
      statusEmoji = 'ℹ️';
  }

  const mailOptions = {
    to: userEmail,
    subject: `${statusEmoji} Appointment ${statusText} - Healthcare System`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor}; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusEmoji} Appointment ${statusText}</h1>
            </div>
            <div class="content">
              <p>Dear ${patientName},</p>
              <p>Your appointment status has been updated to <strong>${statusText}</strong>.</p>
              
              <div class="status-box">
                <p><strong>👨‍⚕️ Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>📅 Date:</strong> ${date}</p>
                <p><strong>🕐 Time:</strong> ${time}</p>
                ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
              </div>
              
              ${status === 'rejected' ? '<p>We apologize for any inconvenience. Please feel free to book another appointment.</p>' : ''}
              ${status === 'completed' ? '<p>Thank you for visiting us. We hope you had a great experience!</p>' : ''}
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return await sendEmail(mailOptions);
};

// Doctor Appointment Request Notification
const sendDoctorAppointmentRequest = async (userEmail, appointmentDetails) => {
  const { doctorName, patientName, date, time, reason } = appointmentDetails;

  const mailOptions = {
    to: userEmail,
    subject: '🔔 New Appointment Request',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .request-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Appointment Request</h1>
            </div>
            <div class="content">
              <p>Dear Dr. ${doctorName},</p>
              <p>You have received a new appointment request:</p>
              
              <div class="request-box">
                <p><strong>👤 Patient:</strong> ${patientName}</p>
                <p><strong>📅 Date:</strong> ${date}</p>
                <p><strong>🕐 Time:</strong> ${time}</p>
                <p><strong>📝 Reason:</strong> ${reason}</p>
              </div>
              
              <p>Please review and respond to this request at your earliest convenience.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/doctor/appointments" class="button">Review Appointments</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return await sendEmail(mailOptions);
};

// Welcome Email
const sendWelcomeEmail = async (userEmail, userData) => {
  const { name, role } = userData;

  const mailOptions = {
    to: userEmail,
    subject: '🎉 Welcome to Healthcare Appointment System',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Healthcare!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Welcome to our Healthcare Appointment System! We're excited to have you on board as a ${role}.</p>
              
              ${role === 'patient' ? `
                <p><strong>As a patient, you can:</strong></p>
                <ul>
                  <li>Browse and search for doctors</li>
                  <li>Book appointments online</li>
                  <li>View your appointment history</li>
                  <li>Manage your profile</li>
                </ul>
              ` : ''}
              
              ${role === 'doctor' ? `
                <p><strong>As a doctor, you can:</strong></p>
                <ul>
                  <li>Manage your profile and availability</li>
                  <li>Review appointment requests</li>
                  <li>Track your appointments</li>
                  <li>View patient information</li>
                </ul>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Get Started</a>
              </div>
              
              <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return await sendEmail(mailOptions);
};

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentStatusUpdate,
  sendDoctorAppointmentRequest,
  sendWelcomeEmail,
  sendEmail, // Export for custom emails
};
