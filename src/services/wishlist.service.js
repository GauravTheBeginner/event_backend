import prisma from '../db/client.js';

export const addToWishlist = async (userId, eventId) => {
  return await prisma.wishlist.upsert({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
    update: {},
    create: {
      userId,
      eventId,
    },
    include: {
      event: true,
    },
  });
};

export const removeFromWishlist = async (userId, eventId) => {
  try {
    return await prisma.wishlist.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
  } catch (error) {
    // If record doesn't exist, ignore error (P2025)
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

export const getUserWishlist = async (userId) => {
  const wishlist = await prisma.wishlist.findMany({
    where: {
      userId,
    },
    include: {
      event: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return wishlist.map(item => item.event);
};

export const checkWishlistStatus = async (userId, eventId) => {
  const item = await prisma.wishlist.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  return !!item;
};
