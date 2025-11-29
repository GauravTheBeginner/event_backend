// Common preference categories for events
export const PREFERENCE_CATEGORIES = {
  EVENT_TYPES: [
    'music',
    'sports',
    'technology',
    'food',
    'art',
    'business',
    'education',
    'health',
    'fitness',
    'gaming',
    'movies',
    'books',
    'travel',
    'photography',
    'fashion',
    'dance',
    'comedy',
    'theater',
    'science',
    'politics'
  ],
  
  INTERESTS: [
    'networking',
    'learning',
    'socializing',
    'professional development',
    'fun',
    'competition',
    'collaboration',
    'creativity',
    'innovation',
    'wellness'
  ],
  
  MUSIC_GENRES: [
    'rock',
    'pop',
    'jazz',
    'classical',
    'electronic',
    'hip hop',
    'country',
    'blues',
    'reggae',
    'folk',
    'indie',
    'metal',
    'r&b',
    'punk',
    'alternative'
  ],
  
  SPORTS: [
    'football',
    'basketball',
    'soccer',
    'tennis',
    'baseball',
    'cricket',
    'volleyball',
    'swimming',
    'running',
    'cycling',
    'yoga',
    'martial arts',
    'golf',
    'hockey',
    'badminton'
  ],
  
  FOOD_CUISINE: [
    'italian',
    'mexican',
    'chinese',
    'japanese',
    'indian',
    'thai',
    'mediterranean',
    'american',
    'french',
    'korean',
    'vietnamese',
    'vegetarian',
    'vegan',
    'seafood',
    'barbecue'
  ]
};

// Get all preferences as a flat array
export const getAllPreferences = () => {
  return Object.values(PREFERENCE_CATEGORIES).flat();
};

// Get preferences by category
export const getPreferencesByCategory = (category) => {
  return PREFERENCE_CATEGORIES[category] || [];
};

// Validate if a preference exists in predefined categories
export const isValidPreference = (preference) => {
  const allPreferences = getAllPreferences();
  return allPreferences.includes(preference.toLowerCase());
};

// Get suggested preferences based on existing ones
export const getSuggestedPreferences = (existingPreferences, limit = 10) => {
  const allPreferences = getAllPreferences();
  const suggested = allPreferences.filter(
    pref => !existingPreferences.includes(pref)
  );
  
  // Shuffle and return limited results
  return suggested.sort(() => 0.5 - Math.random()).slice(0, limit);
};