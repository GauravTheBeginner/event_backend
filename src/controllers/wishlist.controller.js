import * as wishlistService from '../services/wishlist.service.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

export const addToWishlist = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  const result = await wishlistService.addToWishlist(userId, eventId);

  res.status(201).json({
    success: true,
    message: 'Event added to wishlist',
    data: result,
  });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  await wishlistService.removeFromWishlist(userId, eventId);

  res.status(200).json({
    success: true,
    message: 'Event removed from wishlist',
  });
});

export const getUserWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const events = await wishlistService.getUserWishlist(userId);

  res.status(200).json({
    success: true,
    events,
  });
});
