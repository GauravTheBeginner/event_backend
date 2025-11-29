import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { requestOTPSchema, verifyOTPSchema } from '../utils/validation.util.js';

const router = express.Router();

// POST /auth/request-otp - Request OTP for email
router.post('/request-otp', validateBody(requestOTPSchema), authController.requestOTP);

// POST /auth/verify-otp - Verify OTP and get JWT token
router.post('/verify-otp', validateBody(verifyOTPSchema), authController.verifyOTP);

// GET /auth/me - Get current user (protected)
router.get('/me', authenticate, authController.getCurrentUser);

// PUT /auth/me - Update profile (protected)
router.put('/me', authenticate, authController.updateProfile);

// POST /auth/logout - Logout (protected, client-side token deletion)
router.post('/logout', authenticate, authController.logout);

// GET /auth/:id - Get user by ID (protected)
router.get('/:id', authenticate, authController.getUserById);

export default router;
