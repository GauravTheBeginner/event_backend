import express from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireChatAccess } from '../middleware/chat.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { postMessageSchema } from '../utils/validation.util.js';

const router = express.Router();

// Event chat routes (nested under events)
// GET /events/:id/chat - Get chat details (protected, access controlled)
router.get('/events/:id/chat', authenticate, requireChatAccess, chatController.getChat);

// GET /events/:id/chat/messages - Get messages (protected, access controlled)
router.get('/events/:id/chat/messages', authenticate, requireChatAccess, chatController.getMessages);

// POST /events/:id/chat/messages - Post message (protected, access controlled)
router.post('/events/:id/chat/messages', authenticate, requireChatAccess, validateBody(postMessageSchema), chatController.postMessage);

// GET /events/:id/chat/members - Get members (protected, access controlled)
router.get('/events/:id/chat/members', authenticate, requireChatAccess, chatController.getMembers);

// Message-specific routes
// PATCH /chat/messages/:messageId - Edit message (protected)
router.patch('/messages/:messageId', authenticate, validateBody(postMessageSchema), chatController.editMessage);

// DELETE /chat/messages/:messageId - Delete message (protected)
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);

export default router;
