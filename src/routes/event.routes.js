import express from 'express';
import * as eventController from '../controllers/event.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { requireEventOwner } from '../middleware/ownership.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createEventSchema, updateEventSchema } from '../utils/validation.util.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// POST /events/bulk-upload - Bulk upload events via CSV (protected)
router.post('/bulk-upload', authenticate, upload.single('csvFile'), eventController.bulkUploadEvents);

// GET /events/types - Get all unique event types (public)
router.get('/types', eventController.getEventTypes);

// GET /events/my-events - Get events created by authenticated user (protected)
router.get('/my-events', authenticate, eventController.getMyEvents);

// POST /events - Create event (protected)
router.post('/', authenticate, validateBody(createEventSchema), eventController.createEvent);

// GET /events - List all public events (optional auth)
router.get('/', optionalAuth, eventController.listEvents);

// GET /events/:id - Get single event (optional auth)
router.get('/:id', optionalAuth, eventController.getEvent);

// PATCH /events/:id - Update event (protected, owner/admin only)
router.patch('/:id', authenticate, requireEventOwner, validateBody(updateEventSchema), eventController.updateEvent);

// DELETE /events/:id - Delete event (protected, owner/admin only)
router.delete('/:id', authenticate, requireEventOwner, eventController.deleteEvent);

export default router;
