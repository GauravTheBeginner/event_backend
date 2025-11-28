import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

// Send OTP via email
export const sendOTP = async (email, otp) => {
  // In development mode, just log the OTP
  if (process.env.DEV_MODE === 'true') {
    console.log('\n========================================');
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log('========================================\n');
    return { success: true, message: 'OTP logged to console (DEV MODE)' };
  }

  try {
    const emailTransporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@eventplatform.com',
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
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email');
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
