import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import chatRoutes from './routes/chat.routes.js';
import eventBookingRoutes from './routes/eventBooking.routes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (simple version)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', async (req, res) => {
  const { verifyEmailConfig } = await import('./utils/email.service.js');
  const emailStatus = await verifyEmailConfig();
  
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected', // Assume connected if app starts
      email: emailStatus.success ? 'configured' : 'not_configured',
      emailMessage: emailStatus.message
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DEV_MODE: process.env.DEV_MODE,
      EMAIL_HOST: process.env.EMAIL_HOST || 'not_set',
      EMAIL_PORT: process.env.EMAIL_PORT || 'not_set'
    }
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/events', eventBookingRoutes); // Event-specific booking route
app.use('/bookings', bookingRoutes);
app.use('/', chatRoutes); // Chat routes (includes /events/:id/chat/* and /chat/*)

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
