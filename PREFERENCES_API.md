# Preferences API Documentation

## Overview
The preferences system allows users to store their interests and preferences as an array of tags. This helps in event recommendations and finding users with similar interests.

## Endpoints

### Public Endpoints (No Authentication Required)

#### Get Preference Categories
```
GET /preferences/categories
```
Returns all available preference categories with predefined options.

**Response:**
```json
{
  "success": true,
  "categories": {
    "EVENT_TYPES": ["music", "sports", "technology", ...],
    "INTERESTS": ["networking", "learning", "socializing", ...],
    "MUSIC_GENRES": ["rock", "pop", "jazz", ...],
    "SPORTS": ["football", "basketball", "soccer", ...],
    "FOOD_CUISINE": ["italian", "mexican", "chinese", ...]
  }
}
```

#### Search Preferences
```
GET /preferences/search?query=music
```
Search for preferences containing the query string.

**Query Parameters:**
- `query` (required): Search term (min 2 characters)

**Response:**
```json
{
  "success": true,
  "results": ["music", "music production", "live music"]
}
```

### Authenticated Endpoints (Require JWT Token)

#### Get User Preferences
```
GET /preferences
```
Get current user's preferences.

**Response:**
```json
{
  "success": true,
  "preferences": ["music", "technology", "sports"]
}
```

#### Update All Preferences
```
PUT /preferences
```
Replace all user preferences with new array.

**Request Body:**
```json
{
  "preferences": ["music", "technology", "sports", "food"]
}
```

**Response:**
```json
{
  "success": true,
  "preferences": ["music", "technology", "sports", "food"],
  "message": "Preferences updated successfully"
}
```

#### Add Single Preference
```
POST /preferences/add
```
Add a single preference to user's list.

**Request Body:**
```json
{
  "preference": "photography"
}
```

**Response:**
```json
{
  "success": true,
  "preferences": ["music", "technology", "sports", "photography"],
  "message": "Preference added successfully"
}
```

#### Remove Single Preference
```
DELETE /preferences/remove
```
Remove a single preference from user's list.

**Request Body:**
```json
{
  "preference": "sports"
}
```

**Response:**
```json
{
  "success": true,
  "preferences": ["music", "technology", "photography"],
  "message": "Preference removed successfully"
}
```

#### Get Popular Preferences
```
GET /preferences/popular?limit=10
```
Get most popular preferences across all users.

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "preferences": [
    { "preference": "music", "count": 45 },
    { "preference": "technology", "count": 38 },
    { "preference": "sports", "count": 32 }
  ]
}
```

#### Get Users with Similar Preferences
```
GET /preferences/similar-users?limit=10
```
Find users with similar preferences to current user.

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": ["music", "technology", "art"],
      "matchingPreferences": ["music", "technology"],
      "similarityScore": 2,
      "avatarUrl": null
    }
  ]
}
```

#### Get Suggested Preferences
```
GET /preferences/suggestions?limit=10
```
Get preference suggestions based on user's current preferences.

**Query Parameters:**
- `limit` (optional): Number of suggestions (default: 10)

**Response:**
```json
{
  "success": true,
  "suggestions": ["art", "photography", "dance", "movies"]
}
```

## Rules and Limitations

1. **Maximum Preferences:** 20 per user
2. **Preference Length:** 1-50 characters
3. **Format:** Preferences are stored in lowercase, trimmed of whitespace
4. **Duplicates:** Automatically removed
5. **Validation:** Only alphanumeric characters, spaces, and common punctuation allowed

## Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error codes:
- `400`: Bad request (invalid data, missing fields)
- `401`: Unauthorized (missing or invalid token)
- `404`: Resource not found
- `500`: Internal server error

## Usage Examples

### Frontend Integration

```javascript
// Get user preferences
const getPreferences = async () => {
  const response = await fetch('/preferences', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Add preference
const addPreference = async (preference) => {
  const response = await fetch('/preferences/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ preference })
  });
  return response.json();
};

// Update all preferences
const updatePreferences = async (preferences) => {
  const response = await fetch('/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ preferences })
  });
  return response.json();
};
```