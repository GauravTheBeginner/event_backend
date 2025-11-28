# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints

### Request OTP
Request an OTP code for email authentication.

**Endpoint**: `POST /auth/request-otp`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "email": "user@example.com"
}
```

---

### Verify OTP
Verify OTP code and receive JWT token.

**Endpoint**: `POST /auth/verify-otp`

**Request Body**:
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": null,
    "role": "USER",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Current User
Get authenticated user's profile.

**Endpoint**: `GET /auth/me`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Logout
Logout (client should delete token).

**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully. Please delete the token from client-side storage."
}
```

---

## 🎉 Event Endpoints

### Create Event
Create a new event (automatically creates chat room).

**Endpoint**: `POST /events`

**Headers**: `Authorization: Bearer TOKEN`

**Request Body**:
```json
{
  "eventName": "Tech Conference 2024",
  "eventDescription": "Annual technology conference featuring...",
  "eventType": "conference",
  "eventDates": "2024-06-15T09:00:00Z",
  "eventLocation": "Convention Center",
  "locationDataPCityName": "San Francisco",
  "locationDataPStateKey": "CA",
  "eventPlaceAddress": "123 Main St",
  "eventPlaceName": "SF Convention Center",
  "eventAggregateOfferOfferPrice": "99.00",
  "language": "en",
  "duration": "2 days",
  "ticketsNeededFor": "General Admission",
  "image": "https://example.com/image.jpg",
  "bookingUrl": "https://example.com/book"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Event created successfully",
  "event": { /* event object */ },
  "chat": {
    "id": "uuid",
    "chatId": "chat_evt_...",
    "eventId": "uuid",
    "eventName": "Tech Conference 2024",
    "expiresAt": "2024-06-17T09:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### List Events
Get all public events with optional filters.

**Endpoint**: `GET /events`

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `eventType` (string, optional)
- `city` (string, optional)
- `search` (string, optional)

**Example**: `GET /events?page=1&limit=10&city=San Francisco&search=tech`

**Response** (200):
```json
{
  "success": true,
  "events": [/* array of event objects */],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### Get Event
Get single event by ID.

**Endpoint**: `GET /events/:id`

**Response** (200):
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "eventId": "evt_...",
    "eventName": "Tech Conference 2024",
    /* ... other event fields ... */,
    "createdBy": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
    },
    "chat": {
      "id": "uuid",
      "chatId": "chat_evt_...",
      "expiresAt": "2024-06-17T09:00:00Z"
    },
    "_count": {
      "bookings": 15
    }
  }
}
```

---

### Update Event
Update event (owner/admin only).

**Endpoint**: `PATCH /events/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Request Body** (all fields optional):
```json
{
  "eventName": "Updated Event Name",
  "eventDescription": "Updated description",
  "eventDates": "2024-07-01T09:00:00Z"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Event updated successfully",
  "event": { /* updated event object */ }
}
```

---

### Delete Event
Delete event (owner/admin only). Cascades to chat, bookings, etc.

**Endpoint**: `DELETE /events/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

## 🎫 Booking Endpoints

### Book Event
Book an event (auto-adds user to event chat).

**Endpoint**: `POST /events/:id/book`

**Headers**: `Authorization: Bearer TOKEN`

**Request Body**:
```json
{
  "qty": 2,
  "totalPrice": 198.00
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Event booked successfully. You have been added to the event chat.",
  "booking": {
    "id": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "qty": 2,
    "totalPrice": 198,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "addedToChat": true
}
```

---

### Get User Bookings
Get authenticated user's bookings.

**Endpoint**: `GET /bookings/me`

**Headers**: `Authorization: Bearer TOKEN`

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response** (200):
```json
{
  "success": true,
  "bookings": [
    {
      "id": "uuid",
      "userId": "uuid",
      "eventId": "uuid",
      "qty": 2,
      "totalPrice": 198,
      "createdAt": "2024-01-15T10:30:00Z",
      "event": {
        /* full event object */
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### Cancel Booking
Cancel a booking (removes user from chat if not event creator).

**Endpoint**: `DELETE /bookings/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

---

## 💬 Chat Endpoints

### Get Chat Details
Get event chat details (creator/booked users only).

**Endpoint**: `GET /events/:id/chat`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "success": true,
  "chat": {
    "id": "uuid",
    "chatId": "chat_evt_...",
    "eventId": "uuid",
    "eventName": "Tech Conference 2024",
    "expiresAt": "2024-06-17T09:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "_count": {
      "members": 12,
      "messages": 145
    }
  }
}
```

---

### Get Messages
Get chat messages (creator/booked users only).

**Endpoint**: `GET /events/:id/chat/messages`

**Headers**: `Authorization: Bearer TOKEN`

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 50)

**Response** (200):
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "chatId": "uuid",
      "senderId": "uuid",
      "content": "Looking forward to this event!",
      "createdAt": "2024-01-15T10:30:00Z",
      "editedAt": null,
      "deleted": false,
      "sender": {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 145,
    "pages": 3
  }
}
```

---

### Post Message
Post a message to event chat (creator/booked users only).

**Endpoint**: `POST /events/:id/chat/messages`

**Headers**: `Authorization: Bearer TOKEN`

**Request Body**:
```json
{
  "content": "Can't wait for this event!"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "chatId": "uuid",
    "senderId": "uuid",
    "content": "Can't wait for this event!",
    "createdAt": "2024-01-15T10:30:00Z",
    "editedAt": null,
    "deleted": false,
    "sender": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### Get Members
Get chat members (creator/booked users only).

**Endpoint**: `GET /events/:id/chat/members`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "success": true,
  "members": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "joinedAt": "2024-01-15T10:30:00Z",
      "isCreator": true
    }
  ]
}
```

---

### Edit Message
Edit your own message.

**Endpoint**: `PATCH /chat/messages/:messageId`

**Headers**: `Authorization: Bearer TOKEN`

**Request Body**:
```json
{
  "content": "Updated message content"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": {
    /* updated message object with editedAt timestamp */
  }
}
```

---

### Delete Message
Delete your own message (soft delete).

**Endpoint**: `DELETE /chat/messages/:messageId`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
