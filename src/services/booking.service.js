import prisma from '../db/client.js';

// Create booking and auto-add user to chat
export const createBooking = async (userId, eventId, bookingData) => {
  const { qty = 1, totalPrice = 0 } = bookingData;

  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      chat: true
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Create booking and add to chat in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Try to create booking (will fail if duplicate due to unique constraint)
    let booking;
    try {
      booking = await tx.booking.create({
        data: {
          userId,
          eventId: event.id,
          qty,
          totalPrice
        }
      });
    } catch (error) {
      // Check if error is due to unique constraint
      if (error.code === 'P2002') {
        // Booking already exists, fetch it
        booking = await tx.booking.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: event.id
            }
          }
        });
        
        // Check if user is already a chat member
        const existingMember = await tx.chatMember.findUnique({
          where: {
            chatId_userId: {
              chatId: event.chat.id,
              userId
            }
          }
        });

        return {
          booking,
          alreadyBooked: true,
          alreadyInChat: !!existingMember
        };
      }
      throw error;
    }

    // Add user to chat members
    let chatMember;
    try {
      chatMember = await tx.chatMember.create({
        data: {
          chatId: event.chat.id,
          userId
        }
      });
    } catch (error) {
      // User might already be in chat (e.g., event creator)
      if (error.code === 'P2002') {
        chatMember = await tx.chatMember.findUnique({
          where: {
            chatId_userId: {
              chatId: event.chat.id,
              userId
            }
          }
        });
      } else {
        throw error;
      }
    }

    return {
      booking,
      chatMember,
      alreadyBooked: false
    };
  });

  return {
    success: true,
    message: result.alreadyBooked 
      ? 'You have already booked this event' 
      : 'Event booked successfully. You have been added to the event chat.',
    booking: result.booking,
    addedToChat: !result.alreadyInChat
  };
};

// Get user's bookings
export const getUserBookings = async (userId, filters = {}) => {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    }),
    prisma.booking.count({ where: { userId } })
  ]);

  return {
    success: true,
    bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Cancel booking (optional feature)
export const cancelBooking = async (userId, bookingId) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId
    },
    include: {
      event: {
        include: {
          chat: true
        }
      }
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Delete booking and remove from chat
  await prisma.$transaction(async (tx) => {
    await tx.booking.delete({
      where: { id: bookingId }
    });

    // Remove from chat members (unless they're the event creator)
    if (booking.event.createdById !== userId) {
      await tx.chatMember.deleteMany({
        where: {
          chatId: booking.event.chat.id,
          userId
        }
      });
    }
  });

  return {
    success: true,
    message: 'Booking cancelled successfully'
  };
};
