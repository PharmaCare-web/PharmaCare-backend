// Email service for sending verification codes
const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Configure SMTP settings from environment variables
  // Supports Gmail, Outlook, Yahoo, or any SMTP service
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '' // App password for Gmail
    },
    // For Gmail, you might need these options
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send verification code email
const sendVerificationEmail = async (email, verificationCode, userName) => {
  try {
    // Validate SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file');
    }

    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    const mailOptions = {
      from: `"PharmaCare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Email Verification Code - PharmaCare',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">PharmaCare</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #ddd;">
            <h2 style="color: #4CAF50;">Email Verification</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>Thank you for registering with PharmaCare. Please use the following verification code to verify your email address:</p>
            <div style="background-color: #fff; border: 2px solid #4CAF50; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't register for PharmaCare, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        PharmaCare - Email Verification
        
        Hello ${userName || 'User'},
        
        Thank you for registering with PharmaCare. Please use the following verification code to verify your email address:
        
        ${verificationCode}
        
        This code will expire in 10 minutes.
        
        If you didn't register for PharmaCare, please ignore this email.
        
        ---
        This is an automated email, please do not reply.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully to:', email);
    console.log('   Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

module.exports = {
  sendVerificationEmail
};

