import prisma from '../db/client.js';

// Require chat access (creator or booked user)
export const requireChatAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const eventId = req.params.id;

    // Find event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        id: true,
        createdById: true 
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is event creator
    if (event.createdById === req.user.id) {
      return next();
    }

    // Check if user has booked the event
    const booking = await prisma.booking.findUnique({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: event.id
        }
      }
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must book this event to access the chat.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
