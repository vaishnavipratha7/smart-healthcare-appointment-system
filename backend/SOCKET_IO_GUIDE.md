# Socket.io Real-time Notifications Guide

## Overview

The Healthcare Appointment System uses Socket.io for real-time, bidirectional communication between the server and clients. This enables instant notifications for appointment status changes, new reviews, and system alerts without requiring page refreshes.

---

## Features

- ✅ Real-time notifications for all users
- ✅ JWT-based authentication for Socket connections
- ✅ Role-based event broadcasting
- ✅ User presence tracking (online/offline status)
- ✅ Personal notification rooms
- ✅ Typing indicators
- ✅ Automatic reconnection handling
- ✅ Cross-platform support (web, mobile)

---

## Architecture

### Connection Flow

```
Client                     Server
  |                          |
  |------- Connect --------->|
  |   (with JWT token)       |
  |                          |
  |<--- Authenticate --------|
  |   (verify token)         |
  |                          |
  |<--- Join Rooms ----------|
  | (user room, role room)   |
  |                          |
  |<--- Connected Event -----|
  |                          |
  |<==== Notifications ======|
  |                          |
```

### Room Structure

| Room Type | Format | Purpose |
|-----------|--------|---------|
| **User Room** | `user:{userId}` | Personal notifications |
| **Role Room** | `role:{patient\|doctor\|admin}` | Role-specific broadcasts |
| **Global** | Default namespace | System-wide announcements |

---

## Server Setup

### 1. Initialize Socket.io

In `server.js`:

```javascript
const http = require('http');
const { initializeSocket } = require('./services/socketService');

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Use Socket Service

In any controller:

```javascript
const {
  sendNotificationToUser,
  notifyNewAppointment,
  notifyAppointmentStatusChange,
} = require('../services/socketService');

// Example: Send notification when appointment is created
notifyNewAppointment(doctorUserId, {
  appointmentId: appointment._id,
  patientName: patient.name,
  date: formattedDate,
  timeSlot,
  reason,
});
```

---

## Client Integration

### React: Setup Socket Connection

```javascript
// src/services/socketService.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Connect to Socket.io server
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  // Setup default event listeners
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('connected', (data) => {
      console.log('Connected to notification service:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('notification', (notification) => {
      console.log('📬 Notification received:', notification);
      this.handleNotification(notification);
    });

    this.socket.on('user_status_change', (data) => {
      console.log('User status changed:', data);
    });
  }

  // Handle incoming notifications
  handleNotification(notification) {
    // Show toast/snackbar
    if (window.showNotification) {
      window.showNotification(notification);
    }

    // Call registered listeners
    this.listeners.forEach((callback) => {
      callback(notification);
    });
  }

  // Register notification listener
  onNotification(callback) {
    const id = Date.now();
    this.listeners.set(id, callback);
    
    // Return unsubscribe function
    return () => this.listeners.delete(id);
  }

  // Emit custom events
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
```

### React: Use in App Component

```javascript
// src/App.js
import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import socketService from './services/socketService';
import { toast } from 'react-toastify';

function App() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Connect to Socket.io
      socketService.connect(token);

      // Listen for notifications
      const unsubscribe = socketService.onNotification((notification) => {
        // Show toast notification
        toast.info(notification.message, {
          onClick: () => {
            // Navigate to action URL
            window.location.href = notification.actionUrl;
          },
        });

        // Play notification sound
        playNotificationSound();

        // Update notification badge count
        updateNotificationBadge();
      });

      // Cleanup on unmount
      return () => {
        unsubscribe();
        socketService.disconnect();
      };
    }
  }, [token, user]);

  return (
    <div className="App">
      {/* Your app content */}
    </div>
  );
}
```

### React: Notification Component

```javascript
// src/components/NotificationBell.js
import React, { useState, useEffect } from 'react';
import socketService from '../services/socketService';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Listen for new notifications
    const unsubscribe = socketService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  const markAsRead = (notificationId) => {
    socketService.emit('mark_notification_read', notificationId);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="notification-bell">
      <button className="bell-icon">
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>

      <div className="notification-dropdown">
        {notifications.map((notif, index) => (
          <div key={index} className="notification-item">
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
            <button onClick={() => markAsRead(notif.id)}>
              Mark as Read
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Notification Types

### Appointment Notifications

#### 1. NEW_APPOINTMENT
Sent to doctor when patient books appointment.

```javascript
{
  type: 'NEW_APPOINTMENT',
  title: '🗓️ New Appointment Request',
  message: 'New appointment request from John Doe',
  data: {
    appointmentId: '507f...',
    patientName: 'John Doe',
    date: 'Monday, January 15, 2024',
    timeSlot: '10:00',
    reason: 'Regular checkup'
  },
  timestamp: '2024-01-15T10:00:00.000Z',
  actionUrl: '/doctor/appointments'
}
```

#### 2. APPOINTMENT_STATUS_CHANGE
Sent to patient when appointment status changes.

```javascript
{
  type: 'APPOINTMENT_STATUS_CHANGE',
  title: '✅ Appointment approved',
  message: 'Your appointment with Dr. Jane Smith has been approved',
  data: {
    appointmentId: '507f...',
    doctorName: 'Dr. Jane Smith',
    status: 'approved',
    date: 'Monday, January 15, 2024',
    timeSlot: '10:00'
  },
  timestamp: '2024-01-15T10:00:00.000Z',
  actionUrl: '/patient/appointments'
}
```

#### 3. APPOINTMENT_REMINDER
Sent to patient 24 hours before appointment.

```javascript
{
  type: 'APPOINTMENT_REMINDER',
  title: '⏰ Appointment Reminder',
  message: 'You have an appointment with Dr. Jane Smith tomorrow at 10:00',
  data: {
    appointmentId: '507f...',
    doctorName: 'Dr. Jane Smith',
    date: 'Monday, January 15, 2024',
    timeSlot: '10:00',
    hospital: 'City General Hospital'
  },
  timestamp: '2024-01-14T09:00:00.000Z',
  actionUrl: '/patient/appointments'
}
```

### Review Notifications

#### 4. NEW_REVIEW
Sent to doctor when patient leaves a review.

```javascript
{
  type: 'NEW_REVIEW',
  title: '⭐ New Review Received',
  message: 'John Doe left a 5-star review',
  data: {
    reviewId: '507f...',
    patientName: 'John Doe',
    rating: 5,
    comment: 'Excellent doctor! Very professional...'
  },
  timestamp: '2024-01-15T10:00:00.000Z',
  actionUrl: '/doctor/reviews'
}
```

#### 5. REVIEW_RESPONSE
Sent to patient when doctor responds to their review.

```javascript
{
  type: 'REVIEW_RESPONSE',
  title: '💬 Doctor Responded to Your Review',
  message: 'Dr. Jane Smith responded to your review',
  data: {
    reviewId: '507f...',
    doctorName: 'Dr. Jane Smith',
    response: 'Thank you for your kind words...'
  },
  timestamp: '2024-01-15T10:00:00.000Z',
  actionUrl: '/patient/reviews'
}
```

### Admin Notifications

#### 6. ADMIN_ALERT
System alerts for administrators.

```javascript
{
  type: 'ADMIN_ALERT',
  title: '🔔 System Alert',
  message: 'Multiple failed login attempts detected',
  data: {
    severity: 'warning',
    details: '...'
  },
  timestamp: '2024-01-15T10:00:00.000Z',
  actionUrl: '/admin/security'
}
```

#### 7. NEW_DOCTOR_REGISTRATION
Sent to admins when new doctor registers.

```javascript
{
  type: 'NEW_DOCTOR_REGISTRATION',
  title: '👨‍⚕️ New Doctor Registration',
  message: 'Dr. John Smith has registered and needs approval',
  data: {
    doctorId: '507f...',
    name: 'Dr. John Smith',
    specialization: 'Cardiology',
    hospital: 'City General Hospital'
  },
  timestamp: '2024-01-15T10:00:00.000Z',
  actionUrl: '/admin/doctors'
}
```

---

## API Reference

### Server Functions

#### `sendNotificationToUser(userId, notification)`
Send notification to a specific user.

```javascript
sendNotificationToUser('507f...', {
  type: 'CUSTOM',
  title: 'Hello',
  message: 'Test notification',
  data: {},
  timestamp: new Date(),
  actionUrl: '/dashboard'
});
```

#### `sendNotificationToUsers(userIds, notification)`
Send notification to multiple users.

```javascript
sendNotificationToUsers(['507f...', '507g...'], notification);
```

#### `sendNotificationToRole(role, notification)`
Broadcast to all users with a specific role.

```javascript
sendNotificationToRole('doctor', notification);
```

#### `broadcastNotification(notification)`
Broadcast to all connected users.

```javascript
broadcastNotification(notification);
```

#### `isUserOnline(userId)`
Check if user is currently connected.

```javascript
const online = isUserOnline('507f...');
console.log(online); // true or false
```

---

## Best Practices

### 1. Authentication

Always authenticate Socket connections:
- Use JWT tokens in the `auth` handshake
- Verify tokens before allowing connection
- Disconnect invalid connections immediately

### 2. Error Handling

Handle Socket errors gracefully:
```javascript
socket.on('connect_error', (error) => {
  if (error.message === 'Authentication error') {
    // Refresh token and reconnect
    refreshToken().then(newToken => {
      socket.auth.token = newToken;
      socket.connect();
    });
  }
});
```

### 3. Reconnection

Implement automatic reconnection:
```javascript
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### 4. Performance

- Limit notification frequency (debounce)
- Clean up old notifications
- Use rooms for targeted broadcasting
- Implement notification batching for high-frequency events

### 5. Security

- Never send sensitive data through Socket
- Validate all incoming events
- Rate limit Socket events
- Use HTTPS in production

---

## Testing

### Manual Testing

```javascript
// In browser console
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('notification', (data) => {
  console.log('Notification:', data);
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

### Automated Testing

```javascript
// test/socket.test.js
const io = require('socket.io-client');

describe('Socket.io Notifications', () => {
  let clientSocket;

  beforeEach((done) => {
    clientSocket = io('http://localhost:5000', {
      auth: { token: testToken }
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.close();
  });

  it('should receive notification', (done) => {
    clientSocket.on('notification', (data) => {
      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('message');
      done();
    });

    // Trigger notification from server
    triggerNotification();
  });
});
```

---

## Troubleshooting

### Connection Issues

**Problem:** Socket won't connect

**Solutions:**
1. Check CORS configuration
2. Verify JWT token is valid
3. Ensure server is running
4. Check firewall settings
5. Try polling transport: `transports: ['polling']`

### Authentication Errors

**Problem:** "Authentication error: Invalid token"

**Solutions:**
1. Verify token is not expired
2. Check JWT_SECRET matches
3. Ensure token is sent correctly
4. Refresh token if needed

### Missing Notifications

**Problem:** Not receiving notifications

**Solutions:**
1. Check if Socket is connected
2. Verify user is in correct room
3. Check server logs for errors
4. Ensure notification is being sent
5. Test with direct Socket emit

---

## Production Considerations

### 1. Load Balancing

Use Redis adapter for multiple server instances:

```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### 2. Scalability

- Use sticky sessions for load balancing
- Implement Redis for distributed state
- Consider message queuing for high volume
- Monitor active connections

### 3. Monitoring

Track metrics:
- Active connections
- Message throughput
- Error rates
- Latency

### 4. Security

- Use WSS (WebSocket Secure) in production
- Implement rate limiting
- Validate all events
- Log suspicious activity

---

## Future Enhancements

- Push notifications for mobile apps
- Notification persistence (database storage)
- Notification preferences/settings
- Read receipts
- Notification history
- Message threading
- File sharing through Socket
- Video call signaling
