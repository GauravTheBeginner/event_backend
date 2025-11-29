import express from 'express';
import {
  getPreferences,
  updatePreferences,
  addPreference,
  removePreference,
  getPopular,
  getSimilarUsers,
  getCategories,
  getSuggested,
  searchPreferences
} from '../controllers/preferences.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (no authentication required)
// Get preference categories (public - no auth needed)
router.get('/categories', getCategories);

// Search preferences
router.get('/search', searchPreferences);

// All other preference routes require authentication
router.use(authenticate);

// Get current user's preferences
router.get('/', getPreferences);

// Update all preferences (replace)
router.put('/', updatePreferences);

// Add a single preference
router.post('/add', addPreference);

// Remove a single preference
router.delete('/remove', removePreference);

// Get popular preferences across platform
router.get('/popular', getPopular);

// Find users with similar preferences
router.get('/similar-users', getSimilarUsers);

// Get suggested preferences for current user
router.get('/suggestions', getSuggested);

export default router;