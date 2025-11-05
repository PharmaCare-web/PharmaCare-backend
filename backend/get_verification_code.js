// Script to get verification code from database
// Run with: node get_verification_code.js <email>

const mysql = require('mysql2/promise');
require('dotenv').config();

async function getVerificationCode(email) {
  if (!email) {
    console.log('Usage: node get_verification_code.js <email>');
    console.log('Example: node get_verification_code.js john@example.com');
    process.exit(1);
  }

  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pharmacare'
    });

    console.log('✅ Connected to database\n');

    // Get user verification info
    const [users] = await connection.execute(
      `SELECT 
        user_id,
        full_name,
        email,
        verification_code,
        verification_code_expires,
        is_email_verified,
        created_at
       FROM user 
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ User with email "${email}" not found`);
      return;
    }

    const user = users[0];

    console.log('📋 User Information:');
    console.log('   Name:', user.full_name);
    console.log('   Email:', user.email);
    console.log('   User ID:', user.user_id);
    console.log('   Created:', user.created_at);
    console.log('');

    // Check verification status
    if (user.is_email_verified === null || user.is_email_verified === undefined) {
      console.log('⚠️  Verification columns not found in database');
      console.log('   Run: database/add_email_verification.sql');
      return;
    }

    const isVerified = user.is_email_verified === 1 || user.is_email_verified === true;
    console.log('📧 Email Verification Status:');
    console.log('   Status:', isVerified ? '✅ Verified' : '❌ Unverified');
    console.log('');

    if (!isVerified) {
      if (user.verification_code) {
        const now = new Date();
        const expires = user.verification_code_expires ? new Date(user.verification_code_expires) : null;
        const isExpired = expires && now > expires;

        console.log('🔐 Verification Code:');
        console.log('   Code:', user.verification_code);
        console.log('   Expires:', expires ? expires.toLocaleString() : 'Not set');
        console.log('   Status:', isExpired ? '❌ Expired' : '✅ Valid');
        console.log('');
        console.log('💡 Use this code to verify:');
        console.log(`   POST http://localhost:5000/api/auth/verify-email`);
        console.log(`   Body: { "email": "${email}", "verification_code": "${user.verification_code}" }`);
      } else {
        console.log('❌ No verification code found');
        console.log('   User may need to register again or request new code');
      }
    } else {
      console.log('✅ Email is already verified!');
      console.log('   User can login normally');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('\n💡 Verification columns not found. Run: database/add_email_verification.sql');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Get email from command line argument
const email = process.argv[2];
getVerificationCode(email);

