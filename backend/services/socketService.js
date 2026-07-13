const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.io Service for Real-time Notifications
 * Handles WebSocket connections and real-time event broadcasting
 */

let io;

// Store active user connections
const activeUsers = new Map(); // userId -> Set of socketIds

/**
 * Initialize Socket.io server
 */
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    console.log(`✅ User connected: ${socket.userName} (${socket.userRole}) [${socket.id}]`);

    // Add user to active users
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to notification service',
      userId: userId,
      socketId: socket.id,
    });

    // Broadcast online status to relevant users
    broadcastUserStatus(userId, true);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.userName} [${socket.id}] - ${reason}`);

      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // If user has no more active connections, remove from active users
        if (userSockets.size === 0) {
          activeUsers.delete(userId);
          broadcastUserStatus(userId, false);
        }
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(`user:${data.recipientId}`).emit('user_typing', {
        userId: userId,
        userName: socket.userName,
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(`user:${data.recipientId}`).emit('user_stop_typing', {
        userId: userId,
      });
    });

    // Handle custom events
    socket.on('mark_notification_read', (notificationId) => {
      console.log(`Notification ${notificationId} marked as read by ${userId}`);
    });
  });

  console.log('✨ Socket.io initialized successfully');
  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Check if user is online
 */
const isUserOnline = (userId) => {
  return activeUsers.has(userId.toString());
};

/**
 * Get active users count
 */
const getActiveUsersCount = () => {
  return activeUsers.size;
};

/**
 * Get all active user IDs
 */
const getActiveUserIds = () => {
  return Array.from(activeUsers.keys());
};

/**
 * Broadcast user online/offline status
 */
const broadcastUserStatus = (userId, isOnline) => {
  try {
    const io = getIO();
    io.emit('user_status_change', {
      userId,
      isOnline,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error broadcasting user status:', error.message);
  }
};

/**
 * Notification Emitters
 */

// Send notification to specific user
const sendNotificationToUser = (userId, notification) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('notification', notification);
    console.log(`📬 Notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
};

// Send notification to multiple users
const sendNotificationToUsers = (userIds, notification) => {
  userIds.forEach((userId) => {
    sendNotificationToUser(userId, notification);
  });
};

// Send notification to all users with specific role
const sendNotificationToRole = (role, notification) => {
  try {
    const io = getIO();
    io.to(`role:${role}`).emit('notification', notification);
    console.log(`📬 Notification sent to all ${role}s`);
  } catch (error) {
    console.error('Error sending role notification:', error.message);
  }
};

// Broadcast to all connected users
const broadcastNotification = (notification) => {
  try {
    const io = getIO();
    io.emit('notification', notification);
    console.log('📢 Notification broadcasted to all users');
  } catch (error) {
    console.error('Error broadcasting notification:', error.message);
  }
};

/**
 * Appointment-specific notifications
 */

// New appointment request (notify doctor)
const notifyNewAppointment = (doctorUserId, appointmentData) => {
  const notification = {
    type: 'NEW_APPOINTMENT',
    title: '🗓️ New Appointment Request',
    message: `New appointment request from ${appointmentData.patientName}`,
    data: {
      appointmentId: appointmentData.appointmentId,
      patientName: appointmentData.patientName,
      date: appointmentData.date,
      timeSlot: appointmentData.timeSlot,
      reason: appointmentData.reason,
    },
    timestamp: new Date(),
    actionUrl: `/doctor/appointments`,
  };

  sendNotificationToUser(doctorUserId, notification);
};

// Appointment status change (notify patient)
const notifyAppointmentStatusChange = (patientUserId, appointmentData) => {
  const statusEmoji = {
    approved: '✅',
    rejected: '❌',
    completed: '✓',
    cancelled: '⚠️',
  };

  const notification = {
    type: 'APPOINTMENT_STATUS_CHANGE',
    title: `${statusEmoji[appointmentData.status] || ''} Appointment ${appointmentData.status}`,
    message: `Your appointment with Dr. ${appointmentData.doctorName} has been ${appointmentData.status}`,
    data: {
      appointmentId: appointmentData.appointmentId,
      doctorName: appointmentData.doctorName,
      status: appointmentData.status,
      date: appointmentData.date,
      timeSlot: appointmentData.timeSlot,
      rejectionReason: appointmentData.rejectionReason,
    },
    timestamp: new Date(),
    actionUrl: `/patient/appointments`,
  };

  sendNotificationToUser(patientUserId, notification);
};

// Appointment reminder (notify patient)
const notifyAppointmentReminder = (patientUserId, appointmentData) => {
  const notification = {
    type: 'APPOINTMENT_REMINDER',
    title: '⏰ Appointment Reminder',
    message: `You have an appointment with Dr. ${appointmentData.doctorName} tomorrow at ${appointmentData.timeSlot}`,
    data: {
      appointmentId: appointmentData.appointmentId,
      doctorName: appointmentData.doctorName,
      date: appointmentData.date,
      timeSlot: appointmentData.timeSlot,
      hospital: appointmentData.hospital,
    },
    timestamp: new Date(),
    actionUrl: `/patient/appointments`,
  };

  sendNotificationToUser(patientUserId, notification);
};

/**
 * Review notifications
 */

// New review received (notify doctor)
const notifyNewReview = (doctorUserId, reviewData) => {
  const notification = {
    type: 'NEW_REVIEW',
    title: '⭐ New Review Received',
    message: `${reviewData.patientName} left a ${reviewData.rating}-star review`,
    data: {
      reviewId: reviewData.reviewId,
      patientName: reviewData.patientName,
      rating: reviewData.rating,
      comment: reviewData.comment?.substring(0, 100), // First 100 chars
    },
    timestamp: new Date(),
    actionUrl: `/doctor/reviews`,
  };

  sendNotificationToUser(doctorUserId, notification);
};

// Doctor responded to review (notify patient)
const notifyReviewResponse = (patientUserId, reviewData) => {
  const notification = {
    type: 'REVIEW_RESPONSE',
    title: '💬 Doctor Responded to Your Review',
    message: `Dr. ${reviewData.doctorName} responded to your review`,
    data: {
      reviewId: reviewData.reviewId,
      doctorName: reviewData.doctorName,
      response: reviewData.response?.substring(0, 100),
    },
    timestamp: new Date(),
    actionUrl: `/patient/reviews`,
  };

  sendNotificationToUser(patientUserId, notification);
};

/**
 * Admin notifications
 */

// System alert for admins
const notifyAdmins = (alertData) => {
  const notification = {
    type: 'ADMIN_ALERT',
    title: alertData.title || '🔔 System Alert',
    message: alertData.message,
    data: alertData.data || {},
    timestamp: new Date(),
    actionUrl: alertData.actionUrl || '/admin/dashboard',
  };

  sendNotificationToRole('admin', notification);
};

// New doctor registration (notify admins)
const notifyNewDoctorRegistration = (doctorData) => {
  const notification = {
    type: 'NEW_DOCTOR_REGISTRATION',
    title: '👨‍⚕️ New Doctor Registration',
    message: `Dr. ${doctorData.name} has registered and needs approval`,
    data: {
      doctorId: doctorData.doctorId,
      name: doctorData.name,
      specialization: doctorData.specialization,
      hospital: doctorData.hospital,
    },
    timestamp: new Date(),
    actionUrl: '/admin/doctors',
  };

  sendNotificationToRole('admin', notification);
};

/**
 * File upload notifications
 */

// Medical record uploaded (notify doctor)
const notifyMedicalRecordUploaded = (doctorUserId, uploadData) => {
  const notification = {
    type: 'MEDICAL_RECORD_UPLOADED',
    title: '📄 New Medical Record',
    message: `${uploadData.patientName} uploaded a medical record`,
    data: {
      appointmentId: uploadData.appointmentId,
      patientName: uploadData.patientName,
      fileName: uploadData.fileName,
    },
    timestamp: new Date(),
    actionUrl: `/doctor/appointments/${uploadData.appointmentId}`,
  };

  sendNotificationToUser(doctorUserId, notification);
};

module.exports = {
  initializeSocket,
  getIO,
  isUserOnline,
  getActiveUsersCount,
  getActiveUserIds,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToRole,
  broadcastNotification,
  // Appointment notifications
  notifyNewAppointment,
  notifyAppointmentStatusChange,
  notifyAppointmentReminder,
  // Review notifications
  notifyNewReview,
  notifyReviewResponse,
  // Admin notifications
  notifyAdmins,
  notifyNewDoctorRegistration,
  // File notifications
  notifyMedicalRecordUploaded,
};
