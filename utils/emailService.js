const nodemailer = require('nodemailer');

// Constants for Brevo SMTP configuration
const BREVO_CONFIG = {
  HOST: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SECURE: process.env.SMTP_SECURE === 'true' || false,
  CONNECTION_TIMEOUT: 30000,
  SOCKET_TIMEOUT: 60000,
  GREETING_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000
};

/**
 * Create a reusable transporter object using SMTP transport
 * with connection pooling and retry logic for Brevo
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: BREVO_CONFIG.HOST,
    port: BREVO_CONFIG.PORT,
    secure: BREVO_CONFIG.SECURE,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    connectionTimeout: BREVO_CONFIG.CONNECTION_TIMEOUT,
    socketTimeout: BREVO_CONFIG.SOCKET_TIMEOUT,
    greetingTimeout: BREVO_CONFIG.GREETING_TIMEOUT,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      minVersion: 'TLSv1.2'
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    dnsTimeout: 10000,
    logger: process.env.NODE_ENV !== 'production',
    debug: process.env.NODE_ENV !== 'production'
  });
};

/**
 * Helper function to retry failed operations
 */
async function withRetry(operation, maxAttempts = BREVO_CONFIG.MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxAttempts) {
        const delay = BREVO_CONFIG.RETRY_DELAY_MS * attempt;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Send verification code email with retry logic and Brevo optimizations
 */
const sendVerificationEmail = async (email, verificationCode, userName) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file');
  }

  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const verificationLink = `${process.env.FRONTEND_URL || 'https://your-frontend-url.com'}/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: `"PharmaCare" <${fromEmail}>`,
    to: email,
    subject: 'Email Verification Code - PharmaCare',
    headers: {
      'X-SMTPAPI': JSON.stringify({
        category: ['verification'],
        'send_at': Math.floor(Date.now() / 1000) + 5
      }),
      'List-Unsubscribe': `<mailto:unsubscribe@${fromEmail.split('@')[1]}?subject=Unsubscribe_Verification>`,
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk'
    },
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

  // Wrap the send operation with retry logic
  return withRetry(async () => {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully to:', email);
    console.log('   Message ID:', info.messageId);
    console.log('   Envelope:', info.envelope);
    return { 
      success: true, 
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      response: info.response
    };
  }).catch(error => {
    console.error('❌ Failed to send verification email after retries:', error.message);
    const errorDetails = {
      name: error.name,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    };
    console.error('   Error details:', JSON.stringify(errorDetails, null, 2));
    let errorMessage = 'Failed to send verification email';
    switch (error.code) {
      case 'EAUTH':
        errorMessage = 'SMTP authentication failed. Please check your SMTP credentials.';
        if (process.env.NODE_ENV !== 'production') {
          errorMessage += ` (Using SMTP_USER: ${process.env.SMTP_USER ? 'set' : 'not set'})`;
        }
        break;
      case 'ECONNECTION':
        errorMessage = `Cannot connect to SMTP server at ${BREVO_CONFIG.HOST}:${BREVO_CONFIG.PORT}. Please check your network connection and SMTP settings.`;
        break;
      case 'ETIMEDOUT':
        errorMessage = 'SMTP connection timed out. The server took too long to respond.';
        break;
      case 'EENVELOPE':
        errorMessage = 'Invalid email envelope. Please check the recipient email address.';
        break;
      default:
        if (error.response) {
          errorMessage += `: ${error.response}`;
        } else {
          errorMessage += `: ${error.message}`;
        }
    }
    const enhancedError = new Error(errorMessage);
    enhancedError.details = errorDetails;
    throw enhancedError;
  });
};

/**
 * Send password reset email with retry logic and Brevo optimizations
 */
const sendPasswordResetEmail = async (email, temporaryPassword, userName) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file');
  }

  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const resetLink = `${process.env.FRONTEND_URL || 'https://your-frontend-url.com'}/reset-password?token=${temporaryPassword}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: `"PharmaCare" <${fromEmail}>`,
    to: email,
    subject: 'Password Reset - PharmaCare',
    headers: {
      'X-SMTPAPI': JSON.stringify({
        category: ['password_reset'],
        'send_at': Math.floor(Date.now() / 1000) + 5
      }),
      'List-Unsubscribe': `<mailto:unsubscribe@${fromEmail.split('@')[1]}?subject=Unsubscribe_Password_Reset>`,
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk'
    },
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

  // Wrap the send operation with retry logic
  return withRetry(async () => {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', email);
    console.log('   Message ID:', info.messageId);
    console.log('   Envelope:', info.envelope);
    return { 
      success: true, 
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      response: info.response
    };
  }).catch(error => {
    console.error('❌ Failed to send password reset email after retries:', error.message);
    const errorDetails = {
      name: error.name,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    };
    console.error('   Error details:', JSON.stringify(errorDetails, null, 2));
    let errorMessage = 'Failed to send password reset email';
    switch (error.code) {
      case 'EAUTH':
        errorMessage = 'SMTP authentication failed. Please check your SMTP credentials.';
        if (process.env.NODE_ENV !== 'production') {
          errorMessage += ` (Using SMTP_USER: ${process.env.SMTP_USER ? 'set' : 'not set'})`;
        }
        break;
      case 'ECONNECTION':
        errorMessage = `Cannot connect to SMTP server at ${BREVO_CONFIG.HOST}:${BREVO_CONFIG.PORT}. Please check your network connection and SMTP settings.`;
        break;
      case 'ETIMEDOUT':
        errorMessage = 'SMTP connection timed out. The server took too long to respond.';
        break;
      case 'EENVELOPE':
        errorMessage = 'Invalid email envelope. Please check the recipient email address.';
        break;
      default:
        if (error.response) {
          errorMessage += `: ${error.response}`;
        } else {
          errorMessage += `: ${error.message}`;
        }
    }
    const enhancedError = new Error(errorMessage);
    enhancedError.details = errorDetails;
    throw enhancedError;
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};

