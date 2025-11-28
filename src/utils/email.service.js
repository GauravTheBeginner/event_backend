import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    // Log configuration for debugging (without sensitive data)
    console.log('Email Configuration:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      user: process.env.EMAIL_USER ? 'Set' : 'Not Set',
      pass: process.env.EMAIL_PASS ? 'Set' : 'Not Set'
    });

    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds  
      socketTimeout: 60000, // 60 seconds
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

// Send OTP via email
export const sendOTP = async (email, otp) => {
  // In development mode or if email is not configured, just log the OTP
  if (process.env.DEV_MODE === 'true' || process.env.NODE_ENV === 'development') {
    console.log('\n========================================');
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log('========================================\n');
    return { success: true, message: 'OTP logged to console (DEV MODE)' };
  }

  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email not configured. Missing environment variables.');
    console.log('\n========================================');
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log('========================================\n');
    return { success: true, message: 'OTP logged to console (EMAIL NOT CONFIGURED)' };
  }

  try {
    console.log(`Attempting to send email to: ${email}`);
    const emailTransporter = createTransporter();
    
    // Test connection first
    await emailTransporter.verify();
    console.log('SMTP connection verified successfully');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code - Event Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for authentication is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP will expire in 10 minutes.</p>
          <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Event Platform - Your events, simplified.</p>
        </div>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    // Fallback: Log OTP if email fails
    console.log('\n========================================');
    console.log(`📧 EMAIL FAILED - OTP for ${email}: ${otp}`);
    console.log('========================================\n');
    
    // Don't throw error, return success with fallback message
    return { 
      success: true, 
      message: 'Email service unavailable - OTP logged to server console',
      fallback: true
    };
  }
};

// Verify email configuration (optional health check)
export const verifyEmailConfig = async () => {
  if (process.env.DEV_MODE === 'true') {
    return { success: true, message: 'DEV MODE - Email not configured' };
  }
  
  try {
    const emailTransporter = createTransporter();
    await emailTransporter.verify();
    return { success: true, message: 'Email configuration valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
