require('dotenv').config();
const nodemailer = require('nodemailer');

const portsToTry = [
  { port: 587, secure: false },
  { port: 465, secure: true },
  { port: 2525, secure: false }
];

async function testEmail() {
  for (const { port, secure } of portsToTry) {
    try {
      console.log(`\nTrying SMTP ${process.env.SMTP_HOST}:${port} (secure=${secure})...`);

      let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000 // 10 seconds
      });

      // Verify SMTP connection
      await transporter.verify();
      console.log(`✅ SMTP Connection Successful on port ${port}`);

      // Send test email
      let info = await transporter.sendMail({
        from: `"Test Sender" <${process.env.SMTP_USER}>`,
        to: 'dagnmawitadeferes@gmail.com'
,       subject: 'Test Email from Brevo SMTP',
        text: 'This is a test email to verify SMTP configuration.',
        html: '<b>This is a test email to verify SMTP configuration.</b>'
      });

      console.log('✅ Email sent:', info.messageId);
      return; // stop after successful send
    } catch (err) {
      console.error(`❌ Failed on port ${port}:`, err.message);
    }
  }

  console.error('❌ All ports failed. Check your network/firewall/SMTP credentials.');
}

testEmail();
