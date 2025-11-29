import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import chatRoutes from './routes/chat.routes.js';
import eventBookingRoutes from './routes/eventBooking.routes.js';
import preferencesRoutes from './routes/preferences.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';

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
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/events', eventBookingRoutes); // Event-specific booking route
app.use('/bookings', bookingRoutes);
app.use('/preferences', preferencesRoutes);
app.use('/', chatRoutes); // Chat routes (includes /events/:id/chat/* and /chat/*)
app.use('/wishlist', wishlistRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
