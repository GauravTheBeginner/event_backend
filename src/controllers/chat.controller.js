import * as chatService from '../services/chat.service.js';
import { asyncHandler} from '../middleware/errorHandler.middleware.js';
import { getIO } from '../services/socket.js';

// GET /events/:id/chat
export const getChat = asyncHandler(async (req, res) => {
  const result = await chatService.getChatByEventId(req.params.id);
  res.status(200).json(result);
});

// GET /events/:id/chat/messages
export const getMessages = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit
  };
  
  const result = await chatService.getMessages(req.params.id, filters);
  res.status(200).json(result);
});

// POST /events/:id/chat/messages
export const postMessage = asyncHandler(async (req, res) => {
  const { content, mentions } = req.body;
  const result = await chatService.postMessage(
    req.user.id,
    req.params.id,
    content,
    mentions
  );
  
  // Emit new message event - extract message from result wrapper
  getIO().to(req.params.id).emit('new_message', result.message);
  
  res.status(201).json(result);
});

// highlight endpoint removed

// GET /events/:id/chat/members
export const getMembers = asyncHandler(async (req, res) => {
  const result = await chatService.getMembers(req.params.id);
  res.status(200).json(result);
});

// DELETE /chat/messages/:messageId
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId, eventId } = await chatService.deleteMessage(req.user.id, req.params.messageId);
  
  // Emit message deleted event to the room
  if (eventId) {
    getIO().to(eventId).emit('message_deleted', { id: messageId });
  }
  
  res.status(200).json({ success: true, message: 'Message deleted successfully' });
});

// PATCH /chat/messages/:messageId
export const editMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const result = await chatService.editMessage(req.user.id, req.params.messageId, content);
  
  // Emit message updated event - extract message and eventId
  if (result.eventId) {
    getIO().to(result.eventId).emit('message_updated', result.message);
  }
  
  res.status(200).json(result);
});
