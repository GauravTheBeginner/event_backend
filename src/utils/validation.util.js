import { z } from 'zod';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate email format
export const validateEmail = (email) => {
  return emailRegex.test(email);
};

// Zod schemas for request validation

export const requestOTPSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otpCode: z.string().length(6, 'OTP must be 6 digits')
});

export const createEventSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  eventDescription: z.string().min(1, 'Event description is required'),
  eventType: z.string().min(1, 'Event type is required'),
  eventDates: z.string().optional(),
  eventLocation: z.string().min(1, 'Event location is required'),
  locationDataPCityName: z.string().min(1, 'City name is required'),
  locationDataPStateKey: z.string().min(1, 'State key is required'),
  eventPlaceAddress: z.string().min(1, 'Place address is required'),
  eventPlaceName: z.string().min(1, 'Place name is required'),
  eventAggregateOfferOfferPrice: z.string().min(1, 'Price is required'),
  language: z.string().default('en'),
  duration: z.string().min(1, 'Duration is required'),
  ticketsNeededFor: z.string().min(1, 'Tickets needed for is required'),
  image: z.string().url('Invalid image URL'),
  bookingUrl: z.string().optional().or(z.literal('')),
  source: z.string().default('user')
});

export const updateEventSchema = z.object({
  eventName: z.string().min(1).optional(),
  eventDescription: z.string().min(1).optional(),
  eventType: z.string().min(1).optional(),
  eventDates: z.string().optional(),
  eventLocation: z.string().min(1).optional(),
  locationDataPCityName: z.string().min(1).optional(),
  locationDataPStateKey: z.string().min(1).optional(),
  eventPlaceAddress: z.string().min(1).optional(),
  eventPlaceName: z.string().min(1).optional(),
  eventAggregateOfferOfferPrice: z.string().min(1).optional(),
  language: z.string().optional(),
  duration: z.string().min(1).optional(),
  ticketsNeededFor: z.string().min(1).optional(),
  image: z.string().url().optional(),
  bookingUrl: z.string().optional().or(z.literal(''))
});

export const createBookingSchema = z.object({
  qty: z.number().int().positive().default(1),
  totalPrice: z.number().nonnegative().optional()
});

export const postMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long')
});
