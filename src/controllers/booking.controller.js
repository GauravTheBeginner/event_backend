import * as bookingService from '../services/booking.service.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

// POST /events/:id/book
export const createBooking = asyncHandler(async (req, res) => {
  const result = await bookingService.createBooking(req.user.id, req.params.id, req.body);
  res.status(201).json(result);
});

// GET /bookings/me
export const getUserBookings = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit
  };
  
  const result = await bookingService.getUserBookings(req.user.id, filters);
  res.status(200).json(result);
});

// DELETE /bookings/:id
export const cancelBooking = asyncHandler(async (req, res) => {
  const result = await bookingService.cancelBooking(req.user.id, req.params.id);
  res.status(200).json(result);
});
