import express from 'express';
import * as wishlistController from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', wishlistController.getUserWishlist);
router.post('/:eventId', wishlistController.addToWishlist);
router.delete('/:eventId', wishlistController.removeFromWishlist);

export default router;
