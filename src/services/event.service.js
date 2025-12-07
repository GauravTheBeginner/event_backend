import prisma from '../db/client.js';
import { randomBytes } from 'crypto';

// Calculate chat expiry date
const calculateChatExpiry = (eventDate) => {
  if (!eventDate) return null;
  
  const expiryDays = parseInt(process.env.CHAT_EXPIRY_DAYS || '2');
  const expiry = new Date(eventDate);
  expiry.setDate(expiry.getDate() + expiryDays);
  return expiry;
};

// Create event with auto-chat creation
export const createEvent = async (userId, eventData) => {
  
  // Parse event date if provided
  const eventDates = eventData.eventDates;
  
  // Calculate chat expiry
  const chatExpiry = calculateChatExpiry(eventDates);

  // Create event and chat in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create event
    const event = await tx.event.create({
      data: {
        eventName: eventData.eventName,
        eventDescription: eventData.eventDescription,
        eventType: eventData.eventType,
        eventDates,
        eventLocation: eventData.eventLocation,
        locationDataPCityName: eventData.locationDataPCityName,
        locationDataPStateKey: eventData.locationDataPStateKey,
        eventPlaceAddress: eventData.eventPlaceAddress,
        eventPlaceName: eventData.eventPlaceName,
        eventAggregateOfferOfferPrice: eventData.eventAggregateOfferOfferPrice,
        language: eventData.language || 'en',
        duration: eventData.duration,
        ticketsNeededFor: eventData.ticketsNeededFor,
        image: eventData.image,
        bookingUrl: eventData.bookingUrl,
        source: eventData.source || 'user',
        createdById: userId
      }
    });

    let chat = null;

    // Auto-create EventChat only if source is NOT 'csv'
    if (eventData.source !== 'csv' && eventData.source !== 'scrapper') {
      chat = await tx.eventChat.create({
        data: {
          chatId: `chat_${event.id}`,
          eventId: event.id,
          eventName: event.eventName,
          expiresAt: chatExpiry
        }
      });

      // Auto-add creator to chat members
      await tx.chatMember.create({
        data: {
          chatId: chat.id,
          userId
        }
      });
    }

    return { event, chat };
  });

  return {
    success: true,
    message: 'Event created successfully',
    event: result.event,
    chat: result.chat
  };
};

// List events with filters and pagination
export const listEvents = async (filters = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    eventType, 
    city, 
    search 
  } = filters;

  const skip = (page - 1) * limit;

  const where = {
    isPublic: true,
    ...(eventType && { eventType: { contains: eventType, mode: 'insensitive' } }),
    ...(city && { locationDataPCityName: { contains: city, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { eventName: { contains: search, mode: 'insensitive' } },
        { eventDescription: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { eventDates: 'asc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: { bookings: true }
        }
      }
    }),
    prisma.event.count({ where })
  ]);

  return {
    success: true,
    events,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get events created by specific user
export const getMyEvents = async (userId, filters = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    eventType, 
    search 
  } = filters;

  const skip = (page - 1) * limit;

  const where = {
    createdById: userId,
    ...(eventType && { eventType: { contains: eventType, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { eventName: { contains: search, mode: 'insensitive' } },
        { eventDescription: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        chat: {
          select: {
            id: true,
            chatId: true,
            expiresAt: true
          }
        },
        _count: {
          select: { bookings: true }
        }
      }
    }),
    prisma.event.count({ where })
  ]);

  return {
    success: true,
    events,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get single event by ID
export const getEventById = async (eventId) => {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      chat: {
        select: {
          id: true,
          chatId: true,
          expiresAt: true
        }
      },
      _count: {
        select: { bookings: true }
      }
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  return {
    success: true,
    event
  };
};

// Update event
export const updateEvent = async (eventId, eventData) => {
  const updateData = { ...eventData };
  
  // Check if we need to update chat expiry (only for events with eventDates and not from csv/scrapper)
  if (eventData.eventDates) {
    // Keep eventDates as string (don't convert to Date)
    updateData.eventDates = eventData.eventDates;
    
    // Update event and chat expiry in transaction
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: eventId },
        data: updateData
      });

      // Only update chat expiry if source is NOT 'csv' or 'scrapper'
      if (event.source !== 'csv' && event.source !== 'scrapper') {
        const newChatExpiry = calculateChatExpiry(updateData.eventDates);
        
        if (newChatExpiry) {
          await tx.eventChat.updateMany({
            where: { eventId: event.id },
            data: { expiresAt: newChatExpiry }
          });
        }
      }

      return event;
    });

    return {
      success: true,
      message: 'Event updated successfully',
      event: result
    };
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: updateData
  });

  return {
    success: true,
    message: 'Event updated successfully',
    event
  };
};

// Delete event (cascade deletes chat, bookings, etc.)
export const deleteEvent = async (eventId) => {
  await prisma.event.delete({
    where: { id: eventId }
  });

  return {
    success: true,
    message: 'Event deleted successfully'
  };
};

// Bulk create events from CSV
export const bulkCreateEvents = async (userId, eventsData) => {
  const results = {
    successful: [],
    failed: []
  };

  const BATCH_SIZE = 3; // Process 3 events at a time (reduced to prevent connection pool exhaustion)
  const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay between batches
  const MAX_RETRIES = 2; // Retry failed transactions up to 2 times
  
  // Helper function to delay execution
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to create event with retry logic
  const createEventWithRetry = async (eventData, retries = MAX_RETRIES) => {
    try {
      // Clean up property names (remove quotes if present)
      const cleanedData = {};
      for (const key in eventData) {
        // Remove quotes from key names and trim
        const cleanKey = key.replace(/['"]/g, '').trim();
        cleanedData[cleanKey] = eventData[key];
      }
      // if cleanedData.source is not set, set it to 'csv'
      if (!cleanedData.source) {
        cleanedData.source = 'csv';
      }
      
      // Create event using existing service
      const result = await createEvent(userId, cleanedData);
      return { success: true, result };
    } catch (error) {
      // Check if it's a transaction timeout error and we have retries left
      if (error.message.includes('Transaction') && retries > 0) {
        console.log(`   ⚠️  Retrying ${eventData.eventName || 'Unknown'} (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
        await delay(2000); // Wait 2 seconds before retry
        return createEventWithRetry(eventData, retries - 1);
      }
      return { success: false, error: error.message };
    }
  };

  // Process events in batches
  for (let i = 0; i < eventsData.length; i += BATCH_SIZE) {
    const batch = eventsData.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (eventData, batchIndex) => {
      const globalIndex = i + batchIndex;
      const createResult = await createEventWithRetry(eventData);
      
      if (createResult.success) {
        return {
          success: true,
          row: globalIndex + 2, // +2 because row 1 is header and array is 0-indexed
          eventName: eventData.eventName,
          eventId: createResult.result.event.id
        };
      } else {
        return {
          success: false,
          row: globalIndex + 2,
          eventName: eventData.eventName || 'Unknown',
          error: createResult.error
        };
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Categorize results
    batchResults.forEach(result => {
      if (result.success) {
        results.successful.push({
          row: result.row,
          eventName: result.eventName,
          eventId: result.eventId
        });
      } else {
        results.failed.push({
          row: result.row,
          eventName: result.eventName,
          error: result.error
        });
      }
    });

    // Log progress
    console.log(`   📊 Processed ${Math.min(i + BATCH_SIZE, eventsData.length)}/${eventsData.length} events`);
    
    // Add delay between batches (except for the last batch)
    if (i + BATCH_SIZE < eventsData.length) {
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  return {
    success: true,
    message: `Bulk upload completed. ${results.successful.length} events created, ${results.failed.length} failed.`,
    results
  };
};

// Get all unique event types
export const getEventTypes = async () => {
  try {
    // Get all distinct event types from the database
    const eventTypes = await prisma.event.findMany({
      select: {
        eventType: true
      },
      distinct: ['eventType'],
      orderBy: {
        eventType: 'asc'
      }
    });

    // Extract event type values and process comma-separated types
    const allTypes = new Set();
    
    eventTypes.forEach(event => {
      if (event.eventType) {
        // Split by comma, trim whitespace, and add to Set (removes duplicates)
        const types = event.eventType.split(',')
          .map(type => type.trim())
          .filter(type => type.length > 0);
        
        types.forEach(type => allTypes.add(type));
      }
    });

    // Convert Set back to sorted array
    const uniqueTypes = Array.from(allTypes).sort();

    return {
      success: true,
      eventTypes: uniqueTypes,
      count: uniqueTypes.length
    };
  } catch (error) {
    throw new Error(`Failed to fetch event types: ${error.message}`);
  }
};

