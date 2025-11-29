import prisma from '../db/client.js';

// Get chat by event ID
export const getChatByEventId = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      chat: {
        include: {
          _count: {
            select: {
              members: true,
              messages: true
            }
          }
        }
      }
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (!event.chat) {
    throw new Error('Chat not found for this event');
  }

  return {
    success: true,
    chat: event.chat
  };
};

// Get chat messages
export const getMessages = async (eventId, filters = {}) => {
  const { page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  // First get the chat
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { chat: true }
  });

  if (!event || !event.chat) {
    throw new Error('Chat not found');
  }

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        chatId: event.chat.id,
        deleted: false
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    }),
    prisma.chatMessage.count({
      where: {
        chatId: event.chat.id,
        deleted: false
      }
    })
  ]);

  return {
    success: true,
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Post message
export const postMessage = async (userId, eventId, content, mentions = null) => {
  // Get chat
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { chat: true }
  });

  if (!event || !event.chat) {
    throw new Error('Chat not found');
  }

  // Verify user is a member
  const member = await prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId: event.chat.id,
        userId
      }
    }
  });

  if (!member) {
    throw new Error('You are not a member of this chat');
  }

  // reply-to feature removed

  // Create message
  const message = await prisma.chatMessage.create({
    data: {
      chatId: event.chat.id,
      senderId: userId,
      content,
      mentions: mentions,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });

  return {
    success: true,
    message
  };
};

// highlight feature removed

// Get chat members
export const getMembers = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { chat: true }
  });

  if (!event || !event.chat) {
    throw new Error('Chat not found');
  }

  const members = await prisma.chatMember.findMany({
    where: { chatId: event.chat.id },
    orderBy: { joinedAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      }
    }
  });

  return {
    success: true,
    members: members.map(m => ({
      ...m.user,
      joinedAt: m.joinedAt,
      isCreator: event.createdById === m.userId
    }))
  };
};

// Delete message (soft delete)
export const deleteMessage = async (userId, messageId) => {
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: {
      chat: {
        include: {
          event: true
        }
      }
    }
  });

  if (!message) {
    throw new Error('Message not found');
  }

  if (message.senderId !== userId) {
    throw new Error('You can only delete your own messages');
  }

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { deleted: true }
  });

  return {
    messageId,
    eventId: message.chat?.event?.id
  };
};

// Edit message
export const editMessage = async (userId, messageId, content) => {
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: {
      chat: {
        include: {
          event: true
        }
      }
    }
  });

  if (!message) {
    throw new Error('Message not found');
  }

  if (message.senderId !== userId) {
    throw new Error('You can only edit your own messages');
  }

  const updatedMessage = await prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      content,
      editedAt: new Date()
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });

  return {
    success: true,
    message: updatedMessage,
    eventId: message.chat?.event?.id
  };
};
