require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🧪 Testing SMTP Configuration for Staff Emails\n');

console.log('📧 SMTP Settings:');
console.log(`   HOST: ${process.env.SMTP_HOST}`);
console.log(`   PORT: ${process.env.SMTP_PORT}`);
console.log(`   USER: ${process.env.SMTP_USER}`);
console.log(`   PASS: ${process.env.SMTP_PASS ? '***SET***' : '❌ NOT SET'}`);
console.log(`   FROM: ${process.env.SMTP_FROM_EMAIL}\n`);

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('❌ ERROR: SMTP_USER or SMTP_PASS not set in .env file');
  console.log('\nPlease add to .env:');
  console.log('SMTP_PASS=your-brevo-smtp-key');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 30000,
  tls: {
    rejectUnauthorized: false
  }
});

async function testEmailSending() {
  try {
    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    console.log('📨 Sending test verification email...');
    const verificationCode = '123456';
    
    const info = await transporter.sendMail({
      from: `"PharmaCare" <${process.env.SMTP_USER}>`,
      to: 'dagmawitadeferes@gmail.com', // Your email for testing
      subject: 'Test: Staff Verification Code - PharmaCare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4CAF50;">PharmaCare - Test Email</h1>
          <p>This is a test email to verify SMTP configuration for staff creation.</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #4CAF50; letter-spacing: 5px;">${verificationCode}</h2>
          </div>
          <p>If you received this email, staff email sending is working correctly!</p>
        </div>
      `,
      text: `PharmaCare Test Email\n\nVerification Code: ${verificationCode}\n\nIf you received this email, staff email sending is working!`
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Accepted:', info.accepted);
    console.log('   Response:', info.response);
    console.log('\n📬 Check your inbox at: dagmawitadeferes@gmail.com');
    
  } catch (error) {
    console.error('❌ SMTP Test Failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔑 Authentication Error:');
      console.error('   - Verify SMTP_USER is correct (should be like: 9e7d74001@smtp-brevo.com)');
      console.error('   - Verify SMTP_PASS is your Brevo SMTP key (NOT API key)');
      console.error('   - Go to Brevo Dashboard > SMTP & API > SMTP tab');
      console.error('   - Copy the SMTP key (starts with xsmtpsib-)');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🌐 Connection Error:');
      console.error('   - Check your internet connection');
      console.error('   - Verify SMTP_HOST and SMTP_PORT are correct');
    }
    
    console.error('\nFull error:', error);
  }
}

testEmailSending();
