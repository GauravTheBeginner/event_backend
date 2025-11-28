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
  
  // Parse event date if provided
  const eventDates = eventData.eventDates ? new Date(eventData.eventDates) : null;
  
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
    if (eventData.source !== 'csv') {
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
  // Parse event date if provided
  const updateData = { ...eventData };
  if (eventData.eventDates) {
    updateData.eventDates = new Date(eventData.eventDates);
    
    // Update chat expiry if event date changed
    const newChatExpiry = calculateChatExpiry(updateData.eventDates);
    
    // Update event and chat expiry in transaction
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: eventId },
        data: updateData
      });

      if (newChatExpiry) {
        await tx.eventChat.updateMany({
          where: { eventId: event.id },
          data: { expiresAt: newChatExpiry }
        });
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

  // Process each event
  for (let i = 0; i < eventsData.length; i++) {
    const eventData = eventsData[i];
    try {
      // Clean up property names (remove quotes if present)
      const cleanedData = {};
      for (const key in eventData) {
        // Remove quotes from key names and trim
        const cleanKey = key.replace(/['"]/g, '').trim();
        cleanedData[cleanKey] = eventData[key];
      }

      // Parse event date if provided
      if (cleanedData.eventDates) {
        cleanedData.eventDates = new Date(cleanedData.eventDates);
      }

      // Set source to CSV
      cleanedData.source = 'csv';
      
      console.log('Cleaned eventData:', cleanedData);
      console.log('bookingUrl value:', cleanedData.bookingUrl);
      
      // Create event using existing service
      const result = await createEvent(userId, cleanedData);
      
      results.successful.push({
        row: i + 2, // +2 because row 1 is header and array is 0-indexed
        eventName: eventData.eventName,
        eventId: result.event.id
      });
    } catch (error) {
      results.failed.push({
        row: i + 2,
        eventName: eventData.eventName || 'Unknown',
        error: error.message
      });
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

