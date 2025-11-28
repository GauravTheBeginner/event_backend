import { Resend } from 'resend';

// Create Resend instance
let resend = null;

const createResendClient = () => {
  if (!resend) {
    // Log configuration for debugging (without sensitive data)
    console.log('Email Configuration (Resend):', {
      apiKey: process.env.RESEND_API_KEY ? 'Set' : 'Not Set',
      fromEmail: process.env.EMAIL_FROM || 'onboarding@resend.dev'
    });

    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
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

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API key not configured. Missing RESEND_API_KEY environment variable.');
    console.log('\n========================================');
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log('========================================\n');
    return { success: true, message: 'OTP logged to console (RESEND NOT CONFIGURED)' };
  }

  try {
    console.log(`Attempting to send email via Resend to: ${email}`);
    const resendClient = createResendClient();
    
    const emailData = {
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [email],
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

    const { data, error } = await resendClient.emails.send(emailData);
    
    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }
    
    console.log('Email sent successfully via Resend:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name
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
  
  // Check if Resend API key is set
  if (!process.env.RESEND_API_KEY) {
    return { 
      success: false, 
      message: 'Missing required environment variable: RESEND_API_KEY' 
    };
  }
  
  try {
    const resendClient = createResendClient();
    
    // Test Resend connection by checking API status
    // Note: Resend doesn't have a verify method like nodemailer
    // We'll just validate the API key format and create the client
    if (process.env.RESEND_API_KEY.startsWith('re_')) {
      return { success: true, message: 'Resend configuration valid' };
    } else {
      return { 
        success: false, 
        message: 'Invalid Resend API key format. Should start with "re_"' 
      };
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return { 
      success: false, 
      message: `Resend client initialization failed: ${error.message}`,
      details: {
        apiKeySet: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.EMAIL_FROM || 'onboarding@resend.dev'
      }
    };
  }
};
