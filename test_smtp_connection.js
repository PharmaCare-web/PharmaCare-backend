// Test SMTP Connection Script
// Run this to diagnose SMTP connection issues
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n🔍 Testing SMTP Connection...\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n📋 Configuration:');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE || 'false'}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('\n❌ ERROR: SMTP_USER or SMTP_PASS not set in .env file');
  process.exit(1);
}

const port = parseInt(process.env.SMTP_PORT) || 587;
const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

// Check if using Brevo
const isBrevo = process.env.SMTP_HOST && process.env.SMTP_HOST.includes('brevo.com');

console.log(`\n🔌 Attempting connection to ${process.env.SMTP_HOST}:${port}...`);
if (isBrevo) {
  console.log('   Detected Brevo SMTP configuration');
}

// Create transporter with timeout settings (optimized for Brevo)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: port,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 30000, // 30 seconds (increased for reliability)
  socketTimeout: 30000,
  greetingTimeout: 30000,
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2' // Use modern TLS, not outdated SSLv3
  },
  debug: true, // Enable debug for testing
  logger: true
});

// Test connection
console.log('\n⏳ Testing connection...\n');

transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Connection Failed!\n');
    console.log('Error Details:');
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Command: ${error.command || 'N/A'}`);
    console.log(`   Response: ${error.response || 'N/A'}`);
    
    console.log('\n💡 Troubleshooting Tips:');
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.log('\n   1. Check your internet connection');
      console.log('   2. Try port 465 with SSL instead:');
      console.log('      SMTP_PORT=465');
      console.log('      SMTP_SECURE=true');
      console.log('   3. Check if your firewall is blocking port', port);
      console.log('   4. Try disabling antivirus temporarily');
      console.log('   5. Check if your ISP is blocking SMTP ports');
      console.log('   6. Try using a VPN if you\'re on a restricted network');
    } else if (error.code === 'EAUTH') {
      if (isBrevo) {
        console.log('\n   For Brevo SMTP:');
        console.log('   1. SMTP_USER should be your SMTP login (e.g., 9e7d74001@smtp-brevo.com)');
        console.log('   2. SMTP_PASS should be your SMTP API key/password');
        console.log('   3. Verify your credentials in Brevo dashboard');
        console.log('   4. Make sure your sender email is verified in Brevo');
      } else {
        console.log('\n   1. Verify SMTP_USER is your full email address');
        console.log('   2. For Gmail, use App Password (not regular password)');
        console.log('   3. Get App Password: https://myaccount.google.com/apppasswords');
      }
    } else {
      console.log('\n   1. Check your SMTP settings in .env file');
      console.log('   2. Verify your email provider\'s SMTP settings');
      console.log('   3. Check server logs for more details');
    }
    
    console.log('\n' + '='.repeat(60));
    process.exit(1);
  } else {
    console.log('✅ Connection Successful!');
    console.log('   Server is ready to send emails');
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ SMTP configuration is working correctly!\n');
    process.exit(0);
  }
});





