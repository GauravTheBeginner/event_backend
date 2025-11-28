import prisma from '../db/client.js';
import { generateOTP, getOTPExpiry } from '../utils/otp.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { sendOTP } from './email.service.js';
import { validateEmail } from '../utils/validation.util.js';

// Request OTP for email authentication
export const requestOTP = async (email) => {
  // Validate email format
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Extract name from email (part before @)
    const name = email.split('@')[0];
    
    user = await prisma.user.create({
      data: { 
        email,
        name 
      }
    });
  }

  // Generate OTP
  const otpCode = generateOTP();
  const expiresAt = getOTPExpiry(10); // 10 minutes

  // Save OTP to database
  await prisma.oTP.create({
    data: {
      email,
      otpCode,
      expiresAt,
      userId: user.id
    }
  });

  // Send OTP via email
  const emailResult = await sendOTP(email, otpCode);

  return {
    success: true,
    message: emailResult.fallback ? `OTP for ${email}: ${otpCode}` : 'OTP sent successfully',
    email,
    emailStatus: emailResult.fallback ? 'fallback' : 'sent'
  };
};

// Verify OTP and return JWT token
export const verifyOTP = async (email, otpCode) => {
  // Find OTP
  const otp = await prisma.oTP.findFirst({
    where: {
      email,
      otpCode,
      isVerified: false
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!otp) {
    throw new Error('Invalid OTP code');
  }

  // Check if OTP expired
  if (new Date() > new Date(otp.expiresAt)) {
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Mark OTP as verified
  await prisma.oTP.update({
    where: { otpId: otp.otpId },
    data: { isVerified: true }
  });

  // Get user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  return {
    success: true,
    message: 'Authentication successful',
    token,
    user
  };
};

// Get current user (from JWT)
export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    success: true,
    user
  };
};

// Logout (client-side token deletion, but endpoint exists for consistency)
export const logout = async () => {
  return {
    success: true,
    message: 'Logged out successfully. Please delete the token from client-side storage.'
  };
};
