// Quick script to verify .env configuration
require('dotenv').config();

console.log('\n📋 Checking .env Configuration...\n');
console.log('='.repeat(60));

let allGood = true;

// Required fields
const required = {
  'DB_HOST': process.env.DB_HOST,
  'DB_USER': process.env.DB_USER,
  'DB_NAME': process.env.DB_NAME,
  'PORT': process.env.PORT,
  'JWT_SECRET': process.env.JWT_SECRET
};

console.log('\n✅ Required Settings:');
for (const [key, value] of Object.entries(required)) {
  if (value) {
    console.log(`   ${key}: ${key === 'JWT_SECRET' ? '***SET***' : value}`);
  } else {
    console.log(`   ${key}: ❌ NOT SET`);
    allGood = false;
  }
}

// Email settings
console.log('\n📧 Email Settings:');
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`   SMTP_PASS: ***SET***`);
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp-relay.brevo.com'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
  
  // Check for placeholder
  if (process.env.SMTP_USER.includes('your-email') || process.env.SMTP_USER.includes('your-actual-email') || process.env.SMTP_USER.includes('your-brevo')) {
    console.log('\n   ⚠️  WARNING: SMTP_USER contains placeholder!');
    console.log('   Replace with your actual Brevo SMTP username');
    allGood = false;
  } else {
    console.log('   ✅ Email configuration looks good!');
  }
} else {
  console.log('   ❌ SMTP_USER or SMTP_PASS not set');
  allGood = false;
}

console.log('\n' + '='.repeat(60));

if (allGood) {
  console.log('\n✅ All settings are correctly configured!\n');
} else {
  console.log('\n⚠️  Some settings need attention. See above.\n');
}

console.log('Expected .env format:');
console.log(`
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pharmacare
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-smtp-username
SMTP_PASS=your-brevo-smtp-password
`);

