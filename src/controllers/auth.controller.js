import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

// POST /auth/request-otp
export const requestOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const result = await authService.requestOTP(email);
  
  res.status(200).json(result);
});

// POST /auth/verify-otp
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otpCode } = req.body;
  
  const result = await authService.verifyOTP(email, otpCode);
  
  res.status(200).json(result);
});

// GET /auth/me
export const getCurrentUser = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.user.id);
  
  res.status(200).json(result);
});

// POST /auth/logout
export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout();
  
  res.status(200).json(result);
});
