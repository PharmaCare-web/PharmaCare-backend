// Email service using Brevo API (more reliable than SMTP on cloud platforms like Render)
const axios = require('axios');

// Check if Brevo API key is configured
const isBrevoConfigured = () => Boolean(process.env.BREVO_API_KEY);

/**
 * Send verification code email using Brevo API
 */
const sendVerificationEmail = async (email, verificationCode, userName) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured. Please set BREVO_API_KEY in environment variables');
  }

  const fromEmail = process.env.FROM_EMAIL || 'dagmawitadeferes@gmail.com';
  const fromName = process.env.FROM_NAME || 'PharmaCare';

  const emailData = {
    sender: {
      name: fromName,
      email: fromEmail
    },
    to: [
      {
        email: email,
        name: userName || 'User'
      }
    ],
    subject: 'Email Verification Code - PharmaCare',
    htmlContent: `
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
    textContent: `
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

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        timeout: 15000
      }
    );

    console.log('✅ Verification email sent successfully via Brevo API to:', email);
    console.log('   Message ID:', response.data.messageId);

    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error) {
    console.error('❌ Failed to send verification email via Brevo API:', error.message);
    
    if (error.response) {
      console.error('   Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // Handle specific Brevo API errors
      if (error.response.status === 401) {
        throw new Error('Brevo API authentication failed. Please check your BREVO_API_KEY.');
      } else if (error.response.status === 400) {
        throw new Error(`Brevo API error: ${error.response.data.message || 'Invalid request'}`);
      } else if (error.response.status === 403) {
        throw new Error('Brevo API access forbidden. Check your account status and permissions.');
      }
    }
    
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/**
 * Send password reset email using Brevo API
 */
const sendPasswordResetEmail = async (email, temporaryPassword, userName) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured. Please set BREVO_API_KEY in environment variables');
  }

  const fromEmail = process.env.FROM_EMAIL || 'dagmawitadeferes@gmail.com';
  const fromName = process.env.FROM_NAME || 'PharmaCare';

  const emailData = {
    sender: {
      name: fromName,
      email: fromEmail
    },
    to: [
      {
        email: email,
        name: userName || 'User'
      }
    ],
    subject: 'Password Reset - PharmaCare',
    htmlContent: `
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
    textContent: `
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

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        timeout: 15000
      }
    );

    console.log('✅ Password reset email sent successfully via Brevo API to:', email);
    console.log('   Message ID:', response.data.messageId);

    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error) {
    console.error('❌ Failed to send password reset email via Brevo API:', error.message);
    
    if (error.response) {
      console.error('   Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.status === 401) {
        throw new Error('Brevo API authentication failed. Please check your BREVO_API_KEY.');
      } else if (error.response.status === 400) {
        throw new Error(`Brevo API error: ${error.response.data.message || 'Invalid request'}`);
      } else if (error.response.status === 403) {
        throw new Error('Brevo API access forbidden. Check your account status and permissions.');
      }
    }
    
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Send email safely without throwing - returns delivery status for API responses
 */
const sendVerificationEmailSafe = async (email, verificationCode, userName) => {
  if (!isBrevoConfigured()) {
    return {
      sent: false,
      error: 'Brevo API is not configured. Set BREVO_API_KEY environment variable.',
    };
  }

  try {
    await sendVerificationEmail(email, verificationCode, userName);
    return { sent: true };
  } catch (error) {
    return { sent: false, error: error.message };
  }
};

const sendPasswordResetEmailSafe = async (email, temporaryPassword, userName) => {
  if (!isBrevoConfigured()) {
    return {
      sent: false,
      error: 'Brevo API is not configured. Set BREVO_API_KEY environment variable.',
    };
  }

  try {
    await sendPasswordResetEmail(email, temporaryPassword, userName);
    return { sent: true };
  } catch (error) {
    return { sent: false, error: error.message };
  }
};

module.exports = {
  isBrevoConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationEmailSafe,
  sendPasswordResetEmailSafe,
};
