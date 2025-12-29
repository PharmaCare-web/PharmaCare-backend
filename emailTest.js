// emailTest.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER, // your Brevo SMTP username
        pass: process.env.SMTP_PASS  // your Brevo SMTP password or API key
      }
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP Connection Successful');

    // Send test email
    let info = await transporter.sendMail({
      from: `"Test Sender" <${process.env.SMTP_USER}>`,
      to: 'YOUR_EMAIL_HERE', // replace with your email
      subject: 'Test Email from Brevo SMTP',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<b>This is a test email to verify SMTP configuration.</b>'
    });

    console.log('✅ Email sent:', info.messageId);
  } catch (err) {
    console.error('❌ SMTP/email test failed:', err);
  }
}

testEmail();
