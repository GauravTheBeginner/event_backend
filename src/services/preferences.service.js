import prisma from '../db/client.js';

// Get user preferences
export const getUserPreferences = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      preferences: true 
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    success: true,
    preferences: user.preferences || []
  };
};

// Update user preferences
export const updateUserPreferences = async (userId, preferences) => {
  if (!Array.isArray(preferences)) {
    throw new Error('Preferences must be an array');
  }

  // Validate preferences (remove duplicates, trim whitespace)
  const cleanPreferences = [...new Set(
    preferences
      .map(pref => pref.trim().toLowerCase())
      .filter(pref => pref.length > 0 && pref.length <= 50)
  )];

  if (cleanPreferences.length > 20) {
    throw new Error('Maximum 20 preferences allowed');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { preferences: cleanPreferences },
    select: { 
      id: true,
      preferences: true 
    }
  });

  return {
    success: true,
    preferences: updatedUser.preferences,
    message: 'Preferences updated successfully'
  };
};

// Add preference to user
export const addUserPreference = async (userId, preference) => {
  if (!preference || typeof preference !== 'string') {
    throw new Error('Preference must be a non-empty string');
  }

  const cleanPreference = preference.trim().toLowerCase();
  
  if (cleanPreference.length === 0 || cleanPreference.length > 50) {
    throw new Error('Preference must be between 1 and 50 characters');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const currentPreferences = user.preferences || [];
  
  if (currentPreferences.includes(cleanPreference)) {
    throw new Error('Preference already exists');
  }

  if (currentPreferences.length >= 20) {
    throw new Error('Maximum 20 preferences allowed');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      preferences: [...currentPreferences, cleanPreference]
    },
    select: { 
      id: true,
      preferences: true 
    }
  });

  return {
    success: true,
    preferences: updatedUser.preferences,
    message: 'Preference added successfully'
  };
};

// Remove preference from user
export const removeUserPreference = async (userId, preference) => {
  if (!preference || typeof preference !== 'string') {
    throw new Error('Preference must be a non-empty string');
  }

  const cleanPreference = preference.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const currentPreferences = user.preferences || [];
  const updatedPreferences = currentPreferences.filter(pref => pref !== cleanPreference);

  if (updatedPreferences.length === currentPreferences.length) {
    throw new Error('Preference not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { preferences: updatedPreferences },
    select: { 
      id: true,
      preferences: true 
    }
  });

  return {
    success: true,
    preferences: updatedUser.preferences,
    message: 'Preference removed successfully'
  };
};

// Get popular preferences across all users
export const getPopularPreferences = async (limit = 10) => {
  const users = await prisma.user.findMany({
    select: { preferences: true },
    where: {
      preferences: {
        not: { isEmpty: true }
      }
    }
  });

  // Count preferences
  const preferenceCount = {};
  users.forEach(user => {
    user.preferences.forEach(pref => {
      preferenceCount[pref] = (preferenceCount[pref] || 0) + 1;
    });
  });

  // Sort by count and return top preferences
  const popularPreferences = Object.entries(preferenceCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([preference, count]) => ({ preference, count }));

  return {
    success: true,
    preferences: popularPreferences
  };
};

// Find users with similar preferences
export const findUsersWithSimilarPreferences = async (userId, limit = 10) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true }
  });

  if (!user || !user.preferences.length) {
    return {
      success: true,
      users: []
    };
  }

  // Find users with at least one matching preference
  const similarUsers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      preferences: {
        hasSome: user.preferences
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      preferences: true,
      avatarUrl: true
    },
    take: limit
  });

  // Calculate similarity score (number of matching preferences)
  const usersWithSimilarity = similarUsers.map(similarUser => {
    const matchingPreferences = user.preferences.filter(pref => 
      similarUser.preferences.includes(pref)
    );
    
    return {
      ...similarUser,
      matchingPreferences,
      similarityScore: matchingPreferences.length
    };
  }).sort((a, b) => b.similarityScore - a.similarityScore);

  return {
    success: true,
    users: usersWithSimilarity
  };
};