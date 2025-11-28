# Event Platform Backend

Production-ready backend for an Event Platform with email-based OTP authentication, event management, booking system, and community chat functionality.

## 🚀 Features

- **Email + OTP Authentication** - Passwordless login with JWT tokens
- **Event Management** - Create, update, delete, and list events with detailed information
- **Smart Booking System** - Idempotent bookings with automatic chat membership
- **Community Chat** - Event-based chat rooms with auto-creation and expiration
- **Auto-Cleanup** - Scheduled jobs to remove expired event chats
- **Access Control** - Role-based permissions and ownership validation

## 🛠️ Tech Stack

- **Runtime**: Node.js (>=18)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer (SMTP)
- **Validation**: Zod
- **Background Jobs**: node-cron
- **Testing**: Jest + Supertest

## 📋 Prerequisites

- Node.js >= 18
- PostgreSQL database
- SMTP email service (Gmail, SendGrid, etc.) or use DEV_MODE for console logging

## 🔧 Installation

```bash
# Clone the repository
cd event_backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eventdb

# Server
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@eventplatform.com

# Chat Configuration
CHAT_EXPIRY_DAYS=2

# Development Mode (logs OTPs to console instead of sending emails)
DEV_MODE=true
```

## 🗄️ Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Open Prisma Studio (optional - database GUI)
npm run db:studio
```

## 🏃 Running the Server

```bash
# Development mode (with nodemon auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📡 API Endpoints

### Authentication

```
POST   /auth/request-otp      Request OTP for email
POST   /auth/verify-otp       Verify OTP and get JWT token
GET    /auth/me               Get current user (protected)
POST   /auth/logout           Logout (client-side token deletion)
```

### Events

```
POST   /events                Create event (protected)
GET    /events                List all public events
GET    /events/:id            Get single event
PATCH  /events/:id            Update event (owner/admin only)
DELETE /events/:id            Delete event (owner/admin only)
POST   /events/:id/book       Book an event (protected)
```

### Bookings

```
GET    /bookings/me           Get user's bookings (protected)
DELETE /bookings/:id          Cancel booking (protected)
```

### Chat

```
GET    /events/:id/chat                Get chat details (protected, access controlled)
GET    /events/:id/chat/messages       Get messages (protected, access controlled)
POST   /events/:id/chat/messages       Post message (protected, access controlled)
GET    /events/:id/chat/members        Get members (protected, access controlled)
PATCH  /chat/messages/:messageId       Edit message (protected)
DELETE /chat/messages/:messageId       Delete message (protected)
```

## 🔐 Authentication Flow

1. **Request OTP**: `POST /auth/request-otp` with `{ "email": "user@example.com" }`
2. **Check Email/Console**: OTP is sent via email (or logged to console in DEV_MODE)
3. **Verify OTP**: `POST /auth/verify-otp` with `{ "email": "user@example.com", "otpCode": "123456" }`
4. **Use Token**: Include JWT in Authorization header: `Bearer YOUR_JWT_TOKEN`

## 📝 Example Requests

### Request OTP

```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Verify OTP

```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otpCode": "719639"}'
```

### Create Event (with auth token)

```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Tech Conference 2024",
    "eventDescription": "Annual technology conference...",
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
    "image": "https://example.com/image.jpg"
  }'
```

## 🔄 Background Jobs

### Chat Cleanup Job

- **Schedule**: Every 10 minutes
- **Function**: Deletes expired event chats (2 days after event by default)
- **Configuration**: Adjust `CHAT_EXPIRY_DAYS` in `.env`

## 🏗️ Project Structure

```
event_backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── routes/                # API routes
│   ├── middleware/            # Custom middleware
│   ├── utils/                 # Utility functions
│   ├── jobs/                  # Background jobs
│   ├── db/                    # Database client
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🚀 Deployment

1. Set `NODE_ENV=production` in your environment
2. Update `DATABASE_URL` to your production database
3. Set a strong `JWT_SECRET`
4. Configure real SMTP credentials (set `DEV_MODE=false`)
5. Run migrations: `npm run db:migrate`
6. Start server: `npm start`

## 📚 Key Features Explained

### Auto-Chat Creation

When an event is created, a chat room is automatically created with:
- Unique chat ID
- Event name
- Expiry date (event date + CHAT_EXPIRY_DAYS)

### Auto-Chat Membership

When a user books an event:
- Booking is created (idempotent - won't create duplicates)
- User is automatically added to the event's chat room

### Chat Access Control

Only these users can access an event's chat:
- Event creator (automatically added when creating event)
- Users who have booked the event

### Chat Expiration

Chats expire based on `CHAT_EXPIRY_DAYS` environment variable (default: 2 days after event). A cron job runs every 10 minutes to clean up expired chats.

## 🛡️ Security Features

- JWT-based stateless authentication
- Password-less OTP authentication
- Role-based access control (USER/ADMIN)
- Ownership verification for event modifications
- Chat access control
- Input validation with Zod schemas
- SQL injection protection via Prisma

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
