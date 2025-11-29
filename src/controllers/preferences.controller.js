import {
  getUserPreferences,
  updateUserPreferences,
  addUserPreference,
  removeUserPreference,
  getPopularPreferences,
  findUsersWithSimilarPreferences
} from '../services/preferences.service.js';
import { 
  PREFERENCE_CATEGORIES,
  getAllPreferences,
  getSuggestedPreferences 
} from '../utils/preferences.util.js';

// Get current user's preferences
export const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await getUserPreferences(userId);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Update user preferences (replace all)
export const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'Preferences array is required'
      });
    }

    const result = await updateUserPreferences(userId, preferences);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Add a single preference
export const addPreference = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { preference } = req.body;

    if (!preference) {
      return res.status(400).json({
        success: false,
        message: 'Preference is required'
      });
    }

    const result = await addUserPreference(userId, preference);
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// Remove a single preference
export const removePreference = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { preference } = req.body;

    if (!preference) {
      return res.status(400).json({
        success: false,
        message: 'Preference is required'
      });
    }

    const result = await removeUserPreference(userId, preference);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get popular preferences across platform
export const getPopular = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    if (limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit cannot exceed 50'
      });
    }

    const result = await getPopularPreferences(limit);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Find users with similar preferences
export const getSimilarUsers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    if (limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit cannot exceed 50'
      });
    }

    const result = await findUsersWithSimilarPreferences(userId, limit);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get all available preference categories
export const getCategories = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      categories: PREFERENCE_CATEGORIES
    });
  } catch (error) {
    next(error);
  }
};

// Get suggested preferences based on user's current preferences
export const getSuggested = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const userPrefs = await getUserPreferences(userId);
    const suggested = getSuggestedPreferences(userPrefs.preferences, limit);
    
    res.status(200).json({
      success: true,
      suggestions: suggested
    });
  } catch (error) {
    next(error);
  }
};

// Search preferences
export const searchPreferences = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const allPreferences = getAllPreferences();
    const results = allPreferences.filter(pref => 
      pref.toLowerCase().includes(query.toLowerCase())
    );
    
    res.status(200).json({
      success: true,
      results: results.slice(0, 20) // Limit to 20 results
    });
  } catch (error) {
    next(error);
  }
};