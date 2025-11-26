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

console.log(`\n🔌 Attempting connection to ${process.env.SMTP_HOST}:${port}...`);

// Create transporter with timeout settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: port,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 10000, // 10 seconds
  socketTimeout: 10000,
  greetingTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
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
      console.log('\n   1. Verify SMTP_USER is your full email address');
      console.log('   2. For Gmail, use App Password (not regular password)');
      console.log('   3. Get App Password: https://myaccount.google.com/apppasswords');
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





