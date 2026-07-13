import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnecting = false;
  }

  // Connect to Socket.io server
  connect(token) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ Socket connection in progress...');
      return;
    }

    if (!token) {
      console.error('❌ No token provided for Socket connection');
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      this.setupEventListeners();
      this.isConnecting = false;
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      this.isConnecting = false;
    }
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Connected to notification service:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try reconnecting
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.isConnecting = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
    });

    // Handle incoming notifications
    this.socket.on('notification', (notification) => {
      console.log('📬 Notification received:', notification);
      this.handleNotification(notification);
    });

    // Handle user status changes
    this.socket.on('user_status_change', (data) => {
      console.log('👤 User status changed:', data);
      this.notifyListeners('user_status_change', data);
    });

    // Handle typing indicators
    this.socket.on('user_typing', (data) => {
      this.notifyListeners('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      this.notifyListeners('user_stop_typing', data);
    });
  }

  // Handle incoming notifications
  handleNotification(notification) {
    // Notify all registered listeners
    this.notifyListeners('notification', notification);
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Unregister event listener
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const eventListeners = this.listeners.get(event);
    const index = eventListeners.indexOf(callback);
    
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  // Emit custom events
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️  Socket not connected. Cannot emit event:', event);
    }
  }

  // Send typing indicator
  startTyping(recipientId) {
    this.emit('typing', { recipientId });
  }

  // Stop typing indicator
  stopTyping(recipientId) {
    this.emit('stop_typing', { recipientId });
  }

  // Mark notification as read
  markNotificationRead(notificationId) {
    this.emit('mark_notification_read', notificationId);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket...');
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.isConnecting = false;
    }
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
