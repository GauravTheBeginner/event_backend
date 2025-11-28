import prisma from '../db/client.js';

// Require event ownership (creator or admin)
export const requireEventOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const eventId = req.params.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { createdById: true }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is owner or admin
    if (event.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this event'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
