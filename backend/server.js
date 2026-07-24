require('dotenv').config();
const validateEnv = require('./config/envValidator');

// Validate Environment Variables on Startup
validateEnv();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initScheduledJobs } = require('./services/scheduledJobs');
const { initializeSocket } = require('./services/socketService');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Initialize express app
const app = express();

// Trust Render/Vercel proxy headers for accurate rate limiting and client IPs
app.set('trust proxy', 1);

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Connect to MongoDB
connectDB();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows loading uploads/images across origins
}));

// Request Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Cookie Parser
app.use(cookieParser());

// CORS Configuration
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...extraOrigins,
  'http://localhost:3000',
  'https://smart-healthcare-appointment-system-ochre.vercel.app',
  'https://smart-healthcare-appointment-system-8s9wrz8by.vercel.app',
  'https://smart-healthcare-appointment-system-sn64.onrender.com',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Allow non-browser requests like server-side calls, curl, or Postman
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy does not allow access from origin ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded files)
app.use('/uploads', express.static('uploads'));

// Rate Limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', authLimiter); // Protect AI endpoints (expensive ML operations)
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes); // Apply stricter rate limit
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes); // AI-powered appointment assistant

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK', message: 'Server is running' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Initialize scheduled jobs after server starts
  initScheduledJobs();
});