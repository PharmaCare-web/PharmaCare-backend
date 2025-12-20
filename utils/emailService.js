// Email service for sending verification codes
const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Configure SMTP settings from environment variables
  // Supports Gmail, Outlook, Yahoo, Brevo, or any SMTP service
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
  
  // Brevo SMTP configuration
  const isBrevo = process.env.SMTP_HOST && process.env.SMTP_HOST.includes('brevo.com');
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure, // true for 465, false for other ports (STARTTLS)
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    // Connection timeout settings
    connectionTimeout: 30000, // 30 seconds (increased for reliability)
    socketTimeout: 30000, // 30 seconds
    greetingTimeout: 30000, // 30 seconds
    // TLS configuration - optimized for Brevo and modern SMTP servers
    tls: {
      // Don't reject self-signed certificates (useful for some SMTP servers)
      rejectUnauthorized: false,
      // Use modern TLS cipher suites (remove outdated SSLv3)
      minVersion: 'TLSv1.2',
      // For Brevo, we don't need to specify ciphers - let Node.js negotiate
      ...(isBrevo ? {
        // Brevo-specific TLS settings
        ciphers: undefined // Let Node.js choose appropriate ciphers
      } : {
        // For other providers, use default TLS settings
        ciphers: undefined
      })
    },
    // Retry configuration
    pool: false,
    maxConnections: 1,
    maxMessages: 3,
    // Debug mode (set to true for troubleshooting)
    debug: process.env.SMTP_DEBUG === 'true',
    logger: process.env.SMTP_DEBUG === 'true'
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

    // For Brevo, you can use a separate FROM_EMAIL env variable
    // Otherwise, use SMTP_USER (which should be your verified sender email for Brevo)
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"PharmaCare" <${fromEmail}>`,
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
    console.error('   Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide more helpful error messages
    if (error.code === 'EAUTH') {
      throw new Error('SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error(`Failed to connect to SMTP server at ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}. Please check your SMTP_HOST and SMTP_PORT settings.`);
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('SMTP connection timed out. Please check your network connection and SMTP server settings.');
    }
    
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// Send password reset email with temporary password
const sendPasswordResetEmail = async (email, temporaryPassword, userName) => {
  try {
    // Validate SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file');
    }

    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    // For Brevo, you can use a separate FROM_EMAIL env variable
    // Otherwise, use SMTP_USER (which should be your verified sender email for Brevo)
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"PharmaCare" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset - PharmaCare',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #FF6B6B; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">PharmaCare</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #ddd;">
            <h2 style="color: #FF6B6B;">Password Reset Request</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>You have requested to reset your password for your PharmaCare account. A temporary password has been generated for you:</p>
            <div style="background-color: #fff; border: 2px solid #FF6B6B; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your temporary password:</p>
              <h1 style="color: #FF6B6B; font-size: 24px; letter-spacing: 2px; margin: 0; font-family: monospace;">${temporaryPassword}</h1>
            </div>
            <div style="background-color: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Important Security Notice:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
                <li>Please log in with this temporary password immediately</li>
                <li>Change your password to a secure one after logging in</li>
                <li>Do not share this password with anyone</li>
                <li>If you did not request this password reset, please contact support immediately</li>
              </ul>
            </div>
            <p>For security reasons, we recommend changing this password as soon as you log in.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        PharmaCare - Password Reset
        
        Hello ${userName || 'User'},
        
        You have requested to reset your password for your PharmaCare account. A temporary password has been generated for you:
        
        Temporary Password: ${temporaryPassword}
        
        ⚠️ IMPORTANT SECURITY NOTICE:
        - Please log in with this temporary password immediately
        - Change your password to a secure one after logging in
        - Do not share this password with anyone
        - If you did not request this password reset, please contact support immediately
        
        For security reasons, we recommend changing this password as soon as you log in.
        
        ---
        This is an automated email, please do not reply.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', email);
    console.log('   Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    console.error('   Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide more helpful error messages
    if (error.code === 'EAUTH') {
      throw new Error('SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error(`Failed to connect to SMTP server at ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}. Please check your SMTP_HOST and SMTP_PORT settings.`);
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('SMTP connection timed out. Please check your network connection and SMTP server settings.');
    }
    
    // Re-throw with more context
    const errorMessage = error.message || 'Unknown error occurred';
    const enhancedError = new Error(`Failed to send password reset email: ${errorMessage}`);
    enhancedError.code = error.code;
    enhancedError.command = error.command;
    enhancedError.response = error.response;
    enhancedError.responseCode = error.responseCode;
    throw enhancedError;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};

