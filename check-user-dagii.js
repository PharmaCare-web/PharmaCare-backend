require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUser() {
  try {
    console.log('Checking user: dagiiadee@gmail.com\n');

    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.is_active,
        u.is_email_verified,
        u.must_change_password,
        u.is_temporary_password,
        r.role_name,
        b.branch_name
      FROM users u
      LEFT JOIN role r ON u.role_id = r.role_id
      LEFT JOIN branch b ON u.branch_id = b.branch_id
      WHERE u.email = 'dagiiadee@gmail.com'
    `);

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('User Information:');
    console.log('================');
    console.log('User ID:', user.user_id);
    console.log('Name:', user.full_name);
    console.log('Email:', user.email);
    console.log('Role:', user.role_name);
    console.log('Branch:', user.branch_name || 'N/A');
    console.log('Active:', user.is_active ? 'Yes' : 'No');
    console.log('Email Verified:', user.is_email_verified ? 'Yes' : 'No');
    console.log('Must Change Password:', user.must_change_password ? 'Yes' : 'No');
    console.log('Has Temporary Password:', user.is_temporary_password ? 'Yes' : 'No');

    console.log('\n⚠️  Note: Passwords are hashed and cannot be retrieved.');
    console.log('To reset password, use the admin panel or run the reset script.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
