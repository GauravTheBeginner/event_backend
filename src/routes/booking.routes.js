import express from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createBookingSchema } from '../utils/validation.util.js';

const router = express.Router();

// GET /bookings/me - Get user's bookings (protected)
router.get('/me', authenticate, bookingController.getUserBookings);

// DELETE /bookings/:id - Cancel booking (protected)
router.delete('/:id', authenticate, bookingController.cancelBooking);

// Note: Event-specific booking route is in event.routes.js

export default router;
