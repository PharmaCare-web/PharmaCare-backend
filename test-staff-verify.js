// Test staff verification endpoint
const pool = require('./config/database');

async function testStaffVerification() {
  try {
    console.log('🧪 Testing Staff Verification Logic...\n');

    // 1. Find a pending staff member
    const [pendingStaff] = await pool.execute(
      `SELECT u.user_id, u.email, u.full_name, u.verification_code, 
              u.verification_code_expires, u.is_email_verified, u.is_active
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE r.role_name IN ('Pharmacist', 'Cashier')
       AND u.is_email_verified = FALSE
       LIMIT 1`
    );

    if (pendingStaff.length === 0) {
      console.log('❌ No pending staff found. Create a staff member first.');
      return;
    }

    const staff = pendingStaff[0];
    console.log('📋 Found pending staff:', {
      user_id: staff.user_id,
      email: staff.email,
      verification_code: staff.verification_code,
      is_active: staff.is_active,
      is_email_verified: staff.is_email_verified
    });

    // 2. Test the UPDATE query
    console.log('\n🔄 Testing UPDATE query...');
    
    const testPassword = 'TestPassword123';
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const [updateResult] = await pool.execute(
      `UPDATE users 
       SET is_email_verified = TRUE,
           verification_code = NULL,
           verification_code_expires = NULL,
           password = ?,
           is_active = TRUE,
           is_temporary_password = TRUE,
           must_change_password = TRUE
       WHERE user_id = ?`,
      [hashedPassword, staff.user_id]
    );

    console.log('✅ UPDATE executed successfully');
    console.log('   Update result:', updateResult);

    // 3. Verify the update
    const [updatedStaff] = await pool.execute(
      `SELECT user_id, email, is_active, is_email_verified, is_temporary_password
       FROM users
       WHERE user_id = ?`,
      [staff.user_id]
    );

    console.log('\n📋 After UPDATE:', updatedStaff[0]);

    if (updatedStaff[0].is_active && updatedStaff[0].is_email_verified) {
      console.log('\n✅ Staff verification would succeed!');
    } else {
      console.log('\n❌ Staff verification would fail!');
      console.log('   is_active:', updatedStaff[0].is_active);
      console.log('   is_email_verified:', updatedStaff[0].is_email_verified);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testStaffVerification();
