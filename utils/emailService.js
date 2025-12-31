const brevo = require("@getbrevo/brevo");

const sendEmail = async (options) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY is missing!");

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications['apiKey'].apiKey = apiKey;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: process.env.FROM_NAME || "PharmaCare",
      email: process.env.FROM_EMAIL,
    };
    sendSmtpEmail.to = [{ email: options.email }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.textContent = options.message;
    if (options.html) sendSmtpEmail.htmlContent = options.html;

    console.log(`[Brevo] Attempting to send email to ${options.email}...`);

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("✅ [Brevo] Success! Response:", data);
    return data;

  } catch (error) {
    // Better error logging
    if (error.response && error.response.body) {
      console.error("❌ [Brevo] API Error:", error.response.body);
    } else if (error.body) {
      console.error("❌ [Brevo] API Error (body):", error.body);
    } else {
      console.error("❌ [Brevo] General Error:", error.message);
    }
    throw error;
  }
};

// Send verification email with verification code
const sendVerificationEmail = async (email, verificationCode, fullName) => {
  const subject = "Verify Your PharmaCare Account";
  const message = `Hello ${fullName || 'User'},

Thank you for registering with PharmaCare!

Your verification code is: ${verificationCode}

This code will expire in 10 minutes.

Please enter this code to verify your email address and complete your registration.

If you did not request this verification code, please ignore this email.

Best regards,
PharmaCare Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .code { background-color: #fff; border: 2px dashed #4CAF50; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PharmaCare</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${fullName || 'User'},</p>
          <p>Thank you for registering with PharmaCare!</p>
          <p>Your verification code is:</p>
          <div class="code">${verificationCode}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>Please enter this code to verify your email address and complete your registration.</p>
          <p>If you did not request this verification code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>PharmaCare Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    email,
    subject,
    message,
    html
  });
};

// Send password reset email with temporary password
const sendPasswordResetEmail = async (email, temporaryPassword, fullName) => {
  const subject = "Your PharmaCare Password Reset";
  const message = `Hello ${fullName || 'User'},

Your password has been reset. Here is your new temporary password:

Password: ${temporaryPassword}

Please log in with this password and change it immediately for security reasons.

If you did not request this password reset, please contact support immediately.

Best regards,
PharmaCare Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .password { background-color: #fff; border: 2px dashed #4CAF50; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PharmaCare</h1>
        </div>
        <div class="content">
          <h2>Password Reset</h2>
          <p>Hello ${fullName || 'User'},</p>
          <p>Your password has been reset. Here is your new temporary password:</p>
          <div class="password">${temporaryPassword}</div>
          <div class="warning">
            <strong>⚠️ Important:</strong> Please log in with this password and change it immediately for security reasons.
          </div>
          <p>If you did not request this password reset, please contact support immediately.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>PharmaCare Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    email,
    subject,
    message,
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};