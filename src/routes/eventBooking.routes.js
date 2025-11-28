import express from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createBookingSchema } from '../utils/validation.util.js';

const router = express.Router();

// POST /events/:id/book - Book an event (protected)
router.post('/:id/book', authenticate, validateBody(createBookingSchema), bookingController.createBooking);

export default router;
