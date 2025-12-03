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

// PUT /auth/me
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const data = req.body;
  
  const result = await authService.updateProfile(userId, data);
  
  res.status(200).json(result);
});

// GET /auth/:id
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await authService.getUserById(id);
  
  res.status(200).json(result);
});

// GET /auth/users (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  
  const result = await authService.getAllUsers({ page, limit, search });
  
  res.status(200).json(result);
});

// DELETE /auth/users/:id (admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await authService.deleteUser(id);
  
  res.status(200).json(result);
});

// PUT /auth/users/:id (admin only)
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  const result = await authService.updateUser(id, data);
  
  res.status(200).json(result);
});
