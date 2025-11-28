import * as eventService from '../services/event.service.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

// POST /events
export const createEvent = asyncHandler(async (req, res) => {
  const result = await eventService.createEvent(req.user.id, req.body);
  res.status(201).json(result);
});

// GET /events
export const listEvents = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    eventType: req.query.eventType,
    city: req.query.city,
    search: req.query.search
  };
  
  const result = await eventService.listEvents(filters);
  res.status(200).json(result);
});

// GET /events/my-events - Get events created by authenticated user
export const getMyEvents = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    eventType: req.query.eventType,
    search: req.query.search
  };
  
  const result = await eventService.getMyEvents(req.user.id, filters);
  res.status(200).json(result);
});

// GET /events/:id
export const getEvent = asyncHandler(async (req, res) => {
  const result = await eventService.getEventById(req.params.id);
  res.status(200).json(result);
});

// PATCH /events/:id
export const updateEvent = asyncHandler(async (req, res) => {
  const result = await eventService.updateEvent(req.params.id, req.body);
  res.status(200).json(result);
});

// DELETE /events/:id
export const deleteEvent = asyncHandler(async (req, res) => {
  const result = await eventService.deleteEvent(req.params.id);
  res.status(200).json(result);
});

// GET /events/types - Get all unique event types
export const getEventTypes = asyncHandler(async (req, res) => {
  const result = await eventService.getEventTypes();
  res.status(200).json(result);
});

// POST /events/bulk-upload
export const bulkUploadEvents = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Parse CSV
  const { parse } = await import('csv-parse/sync');
  const fileContent = req.file.buffer.toString('utf-8');
  
  let records;
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    console.log('Parsed CSV Records (first 1):', records[0]);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid CSV format',
      error: error.message
    });
  }

  if (records.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'CSV file is empty'
    });
  }
  console.log('Parsed CSV Records (first 1):', records);
  const result = await eventService.bulkCreateEvents(req.user.id, records);
  res.status(201).json(result);
});

