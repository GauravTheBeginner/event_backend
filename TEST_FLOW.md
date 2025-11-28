# Complete Test Flow - Multi-User Event Booking & Chat

This document demonstrates a complete end-to-end test scenario with 3 users booking the same event and participating in the event chat room.

## Test Scenario Overview

- **User 1 (Alice)** - Event Creator
- **User 2 (Bob)** - First attendee
- **User 3 (Charlie)** - Second attendee

**Flow:**
1. Alice creates an event (auto-creates chat room)
2. Bob books the event (auto-joins chat)
3. Charlie books the event (auto-joins chat)
4. All 3 users send messages
5. View messages from each user's perspective
6. Demonstrate message editing and deletion

---

## Prerequisites

Ensure the server is running:
```bash
npm run dev
```

---

## Step 1: User 1 (Alice) - Event Creator

### 1.1 Request OTP for Alice

```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com"}'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "email": "alice@example.com"
}
```

**Check server logs for OTP code** (e.g., `123456`)

### 1.2 Verify OTP for Alice

```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "otpCode": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "alice-user-id",
    "email": "alice@example.com",
    "name": null,
    "role": "USER",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Save Alice's token:** `ALICE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.3 Alice Creates Event

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -d '{
    "eventName": "Web3 Developers Meetup 2024",
    "eventDescription": "Join us for an exciting meetup about Web3 technologies, blockchain, and decentralized applications. Network with fellow developers and learn about the latest trends.",
    "eventType": "meetup",
    "eventDates": "2024-08-20T18:00:00Z",
    "eventLocation": "Tech Hub Downtown",
    "locationDataPCityName": "San Francisco",
    "locationDataPStateKey": "CA",
    "eventPlaceAddress": "456 Tech Street",
    "eventPlaceName": "Innovation Center",
    "eventAggregateOfferOfferPrice": "25.00",
    "language": "en",
    "duration": "3 hours",
    "ticketsNeededFor": "General Admission",
    "image": "https://example.com/web3-meetup.jpg",
    "bookingUrl": "https://example.com/book/web3"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "event": {
    "id": "event-uuid-123",
    "eventId": "evt_abc123",
    "eventName": "Web3 Developers Meetup 2024",
    "createdById": "alice-user-id",
    "createdAt": "2024-01-15T10:05:00Z"
  },
  "chat": {
    "id": "chat-uuid-456",
    "chatId": "chat_evt_abc123",
    "eventId": "event-uuid-123",
    "eventName": "Web3 Developers Meetup 2024",
    "expiresAt": "2024-08-22T18:00:00Z",
    "createdAt": "2024-01-15T10:05:00Z"
  }
}
```

**Save Event ID:** `EVENT_ID=event-uuid-123`

---

## Step 2: User 2 (Bob) - First Attendee

### 2.1 Request OTP for Bob

```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@example.com"}'
```

**Check server logs for Bob's OTP code**

### 2.2 Verify OTP for Bob

```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "otpCode": "654321"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.bob...",
  "user": {
    "id": "bob-user-id",
    "email": "bob@example.com",
    "name": null,
    "role": "USER"
  }
}
```

**Save Bob's token:** `BOB_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.bob...`

### 2.3 Bob Views Event

```bash
curl -X GET http://localhost:3000/events/EVENT_ID
```

**Response shows event details with booking count**

### 2.4 Bob Books Event

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BOB_TOKEN" \
  -d '{
    "qty": 1,
    "totalPrice": 25.00
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Event booked successfully. You have been added to the event chat.",
  "booking": {
    "id": "booking-bob-123",
    "userId": "bob-user-id",
    "eventId": "event-uuid-123",
    "qty": 1,
    "totalPrice": 25,
    "createdAt": "2024-01-15T10:10:00Z"
  },
  "addedToChat": true
}
```

---

## Step 3: User 3 (Charlie) - Second Attendee

### 3.1 Request OTP for Charlie

```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "charlie@example.com"}'
```

**Check server logs for Charlie's OTP code**

### 3.2 Verify OTP for Charlie

```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "charlie@example.com",
    "otpCode": "789012"
  }'
```

**Save Charlie's token:** `CHARLIE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.charlie...`

### 3.3 Charlie Books Event

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CHARLIE_TOKEN" \
  -d '{
    "qty": 2,
    "totalPrice": 50.00
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Event booked successfully. You have been added to the event chat.",
  "booking": {
    "id": "booking-charlie-456",
    "userId": "charlie-user-id",
    "eventId": "event-uuid-123",
    "qty": 2,
    "totalPrice": 50,
    "createdAt": "2024-01-15T10:15:00Z"
  },
  "addedToChat": true
}
```

---

## Step 4: View Chat Members (All 3 Users)

### 4.1 Alice Checks Chat Members

```bash
curl -X GET http://localhost:3000/events/EVENT_ID/chat/members \
  -H "Authorization: Bearer ALICE_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "members": [
    {
      "id": "alice-user-id",
      "name": null,
      "email": "alice@example.com",
      "joinedAt": "2024-01-15T10:05:00Z",
      "isCreator": true
    },
    {
      "id": "bob-user-id",
      "name": null,
      "email": "bob@example.com",
      "joinedAt": "2024-01-15T10:10:00Z",
      "isCreator": false
    },
    {
      "id": "charlie-user-id",
      "name": null,
      "email": "charlie@example.com",
      "joinedAt": "2024-01-15T10:15:00Z",
      "isCreator": false
    }
  ]
}
```

---

## Step 5: Users Send Messages

### 5.1 Alice Sends Welcome Message

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -d '{
    "content": "Welcome everyone to the Web3 Developers Meetup! 🎉 Looking forward to meeting you all!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-alice-1",
    "chatId": "chat-uuid-456",
    "senderId": "alice-user-id",
    "content": "Welcome everyone to the Web3 Developers Meetup! 🎉 Looking forward to meeting you all!",
    "createdAt": "2024-01-15T10:20:00Z",
    "editedAt": null,
    "deleted": false,
    "sender": {
      "id": "alice-user-id",
      "name": null,
      "email": "alice@example.com"
    }
  }
}
```

### 5.2 Bob Sends First Message

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BOB_TOKEN" \
  -d '{
    "content": "Thanks Alice! Super excited about this meetup. Will there be any hands-on workshops?"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-bob-1",
    "chatId": "chat-uuid-456",
    "senderId": "bob-user-id",
    "content": "Thanks Alice! Super excited about this meetup. Will there be any hands-on workshops?",
    "createdAt": "2024-01-15T10:22:00Z",
    "editedAt": null,
    "deleted": false,
    "sender": {
      "id": "bob-user-id",
      "name": null,
      "email": "bob@example.com"
    }
  }
}
```

### 5.3 Charlie Sends First Message

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CHARLIE_TOKEN" \
  -d '{
    "content": "Hi everyone! First time attending a Web3 event. Can someone recommend good resources to prepare?"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-charlie-1",
    "chatId": "chat-uuid-456",
    "senderId": "charlie-user-id",
    "content": "Hi everyone! First time attending a Web3 event. Can someone recommend good resources to prepare?",
    "createdAt": "2024-01-15T10:25:00Z",
    "editedAt": null,
    "deleted": false,
    "sender": {
      "id": "charlie-user-id",
      "name": null,
      "email": "charlie@example.com"
    }
  }
}
```

### 5.4 Alice Replies to Bob

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -d '{
    "content": "@Bob Yes! We will have a hands-on smart contract development workshop in the afternoon session."
  }'
```

### 5.5 Alice Helps Charlie

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -d '{
    "content": "@Charlie Welcome! I recommend checking out ethereum.org and learning about MetaMask basics before the event."
  }'
```

### 5.6 Bob Responds to Charlie

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BOB_TOKEN" \
  -d '{
    "content": "@Charlie Also check out the Solidity documentation - very helpful for beginners!"
  }'
```

### 5.7 Charlie Thanks Everyone

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CHARLIE_TOKEN" \
  -d '{
    "content": "Thanks @Alice and @Bob! I will definitely check those out. See you all at the event! 🚀"
  }'
```

---

## Step 6: View Messages from Each User's Perspective

### 6.1 Alice Views All Messages

```bash
curl -X GET "http://localhost:3000/events/EVENT_ID/chat/messages?page=1&limit=50" \
  -H "Authorization: Bearer ALICE_TOKEN"
```

**Response (Alice's View):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-alice-1",
      "chatId": "chat-uuid-456",
      "senderId": "alice-user-id",
      "content": "Welcome everyone to the Web3 Developers Meetup! 🎉 Looking forward to meeting you all!",
      "createdAt": "2024-01-15T10:20:00Z",
      "editedAt": null,
      "deleted": false,
      "sender": {
        "id": "alice-user-id",
        "name": null,
        "email": "alice@example.com"
      }
    },
    {
      "id": "msg-bob-1",
      "chatId": "chat-uuid-456",
      "senderId": "bob-user-id",
      "content": "Thanks Alice! Super excited about this meetup. Will there be any hands-on workshops?",
      "createdAt": "2024-01-15T10:22:00Z",
      "editedAt": null,
      "deleted": false,
      "sender": {
        "id": "bob-user-id",
        "name": null,
        "email": "bob@example.com"
      }
    },
    {
      "id": "msg-charlie-1",
      "chatId": "chat-uuid-456",
      "senderId": "charlie-user-id",
      "content": "Hi everyone! First time attending a Web3 event. Can someone recommend good resources to prepare?",
      "createdAt": "2024-01-15T10:25:00Z",
      "editedAt": null,
      "deleted": false,
      "sender": {
        "id": "charlie-user-id",
        "name": null,
        "email": "charlie@example.com"
      }
    },
    {
      "id": "msg-alice-2",
      "chatId": "chat-uuid-456",
      "senderId": "alice-user-id",
      "content": "@Bob Yes! We will have a hands-on smart contract development workshop in the afternoon session.",
      "createdAt": "2024-01-15T10:27:00Z",
      "editedAt": null,
      "deleted": false,
      "sender": {
        "id": "alice-user-id",
        "name": null,
        "email": "alice@example.com"
      }
    },
    {
      "id": "msg-alice-3",
      "chatId": "chat-uuid-456",
      "senderId": "alice-user-id",
      "content": "@Charlie Welcome! I recommend checking out ethereum.org and learning about MetaMask basics before the event.",
      "createdAt": "2024-01-15T10:28:00Z",
      "editedAt": null,
      "deleted": false,
      "sender": {
        "id": "alice-user-id",
        "name": null,
        "email": "alice@example.com"
      }
    },
    {
      "id": "msg-bob-2",
      "chatId": "chat-uuid-456",
      "senderId": "bob-user-id",
      "content": "@Charlie Also check out the Solidity documentation - very helpful for beginners!",
      "createdAt": "2024-01-15T10:30:00Z",
      "editedAt": null,
      "deleted": false,
      "sender": {
        "id": "bob-user-id",
        "name": null,
        "email": "bob@example.com"
      }
    },
    {
      "id": "msg-charlie-2",
      "chatId": "chat-uuid-456",
      "senderId": "charlie-user-id",
      "content": "Thanks @Alice and @Bob! I will definitely check those out. See you all at the event! 🚀",
      "createdAt": "2024-01-15T10:32:00Z",
      "editedAt": null,
      "deleted": false,
      "sender": {
        "id": "charlie-user-id",
        "name": null,
        "email": "charlie@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 7,
    "pages": 1
  }
}
```

**Alice's Perspective:**
- Sees all 7 messages
- Can identify her own messages (3 messages)
- Can see responses from Bob (2 messages) and Charlie (2 messages)
- As event creator, has full access to chat

### 6.2 Bob Views All Messages

```bash
curl -X GET "http://localhost:3000/events/EVENT_ID/chat/messages?page=1&limit=50" \
  -H "Authorization: Bearer BOB_TOKEN"
```

**Bob's Perspective:**
- Sees the same 7 messages
- Can identify his own messages (2 messages)
- Sees Alice's welcome and responses (3 messages)
- Sees Charlie's questions and thanks (2 messages)
- As an attendee, sees the conversation flow

### 6.3 Charlie Views All Messages

```bash
curl -X GET "http://localhost:3000/events/EVENT_ID/chat/messages?page=1&limit=50" \
  -H "Authorization: Bearer CHARLIE_TOKEN"
```

**Charlie's Perspective:**
- Sees all 7 messages
- Can identify his own messages (2 messages)
- Received helpful responses from Alice and Bob
- Can follow the entire conversation

---

## Step 7: Message Editing

### 7.1 Bob Edits His First Message

```bash
curl -X PATCH http://localhost:3000/chat/messages/msg-bob-1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BOB_TOKEN" \
  -d '{
    "content": "Thanks Alice! Super excited about this meetup. Will there be any hands-on workshops? Also, what time does it start?"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-bob-1",
    "chatId": "chat-uuid-456",
    "senderId": "bob-user-id",
    "content": "Thanks Alice! Super excited about this meetup. Will there be any hands-on workshops? Also, what time does it start?",
    "createdAt": "2024-01-15T10:22:00Z",
    "editedAt": "2024-01-15T10:35:00Z",
    "deleted": false,
    "sender": {
      "id": "bob-user-id",
      "name": null,
      "email": "bob@example.com"
    }
  }
}
```

**Note:** Message now has `editedAt` timestamp showing it was modified.

---

## Step 8: Message Deletion

### 8.1 Charlie Deletes a Message

```bash
curl -X DELETE http://localhost:3000/chat/messages/msg-charlie-1 \
  -H "Authorization: Bearer CHARLIE_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### 8.2 View Messages After Deletion

```bash
curl -X GET "http://localhost:3000/events/EVENT_ID/chat/messages?page=1&limit=50" \
  -H "Authorization: Bearer ALICE_TOKEN"
```

**Charlie's first message now shows:**
```json
{
  "id": "msg-charlie-1",
  "chatId": "chat-uuid-456",
  "senderId": "charlie-user-id",
  "content": "Hi everyone! First time attending a Web3 event. Can someone recommend good resources to prepare?",
  "createdAt": "2024-01-15T10:25:00Z",
  "editedAt": null,
  "deleted": true,
  "sender": {
    "id": "charlie-user-id",
    "name": null,
    "email": "charlie@example.com"
  }
}
```

**Note:** Message is soft-deleted (`deleted: true`) but content is preserved for context.

---

## Step 9: View User Bookings

### 9.1 Bob Checks His Bookings

```bash
curl -X GET "http://localhost:3000/bookings/me?page=1&limit=20" \
  -H "Authorization: Bearer BOB_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking-bob-123",
      "userId": "bob-user-id",
      "eventId": "event-uuid-123",
      "qty": 1,
      "totalPrice": 25,
      "createdAt": "2024-01-15T10:10:00Z",
      "event": {
        "id": "event-uuid-123",
        "eventName": "Web3 Developers Meetup 2024",
        "eventDescription": "Join us for an exciting meetup...",
        "eventDates": "2024-08-20T18:00:00Z",
        "eventLocation": "Tech Hub Downtown",
        "locationDataPCityName": "San Francisco",
        "eventAggregateOfferOfferPrice": "25.00",
        "image": "https://example.com/web3-meetup.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### 9.2 Charlie Checks His Bookings

```bash
curl -X GET "http://localhost:3000/bookings/me?page=1&limit=20" \
  -H "Authorization: Bearer CHARLIE_TOKEN"
```

**Shows Charlie's booking with qty: 2, totalPrice: 50**

---

## Step 10: View Chat Details

### 10.1 Alice Views Chat Statistics

```bash
curl -X GET http://localhost:3000/events/EVENT_ID/chat \
  -H "Authorization: Bearer ALICE_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat-uuid-456",
    "chatId": "chat_evt_abc123",
    "eventId": "event-uuid-123",
    "eventName": "Web3 Developers Meetup 2024",
    "expiresAt": "2024-08-22T18:00:00Z",
    "createdAt": "2024-01-15T10:05:00Z",
    "_count": {
      "members": 3,
      "messages": 7
    }
  }
}
```

**Summary:**
- 3 members (Alice, Bob, Charlie)
- 7 total messages
- Chat expires 2 days after the event

---

## Test Summary

### ✅ Completed Actions

1. **User Creation & Authentication:**
   - Alice (Event Creator) ✓
   - Bob (Attendee 1) ✓
   - Charlie (Attendee 2) ✓

2. **Event Management:**
   - Alice created event ✓
   - Chat room auto-created ✓

3. **Bookings:**
   - Bob booked 1 ticket ($25) ✓
   - Charlie booked 2 tickets ($50) ✓
   - Both auto-added to chat ✓

4. **Chat Interactions:**
   - Alice sent 3 messages ✓
   - Bob sent 2 messages ✓
   - Charlie sent 2 messages ✓
   - Total: 7 messages ✓

5. **Message Management:**
   - Bob edited a message ✓
   - Charlie deleted a message (soft delete) ✓

6. **Verification:**
   - All users can view all messages ✓
   - Chat members list shows all 3 users ✓
   - Message counts accurate ✓

### 📊 Final State

- **Event:** Web3 Developers Meetup 2024
- **Total Bookings:** 2 (3 tickets total)
- **Chat Members:** 3 (1 creator + 2 attendees)
- **Total Messages:** 7 (1 deleted, 1 edited)
- **Chat Status:** Active until 2024-08-22

---

## Notes

- **OTP Codes:** Check server console logs for actual OTP codes
- **Token Management:** Save tokens as environment variables for easier testing
- **Chat Access:** Only creator and attendees can access chat
- **Auto-Join:** Booking automatically adds users to chat
- **Soft Delete:** Deleted messages are marked as deleted but content preserved
- **Edit Tracking:** Edited messages show `editedAt` timestamp

---

## Quick Test Script

For automated testing, you can use this bash script:

```bash
#!/bin/bash

# Set base URL
BASE_URL="http://localhost:3000"

# Test the complete flow
echo "Starting multi-user test flow..."

# Add your curl commands here in sequence
# Remember to extract and save tokens and IDs from responses

echo "Test flow completed!"
```
