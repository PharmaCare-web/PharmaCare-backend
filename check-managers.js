/**
 * Check all managers in database
 * Usage: node check-managers.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkManagers() {
  try {
    console.log('🔍 Checking managers in database...\n');

    // Get all users with Manager role
    const result = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.is_active, u.is_email_verified, 
              u.created_at, r.role_name, b.branch_name, b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE r.role_name = 'Manager'
       ORDER BY u.created_at DESC`
    );

    const managers = result.rows;

    if (managers.length === 0) {
      console.log('❌ No managers found in database');
      console.log('\nPossible issues:');
      console.log('1. Registration failed on backend');
      console.log('2. Backend is using a different database');
      console.log('3. Role name is not exactly "Manager"');
    } else {
      console.log(`✅ Found ${managers.length} manager(s):\n`);
      
      managers.forEach((manager, index) => {
        console.log(`${index + 1}. ${manager.full_name}`);
        console.log(`   Email: ${manager.email}`);
        console.log(`   Status: ${manager.is_active ? '✅ Active' : '⏳ Pending Activation'}`);
        console.log(`   Email Verified: ${manager.is_email_verified ? 'Yes' : 'No'}`);
        console.log(`   Branch: ${manager.branch_name || 'Not assigned'}`);
        if (manager.location) console.log(`   Location: ${manager.location}`);
        console.log(`   Registered: ${new Date(manager.created_at).toLocaleString()}`);
        console.log('');
      });

      // Count pending
      const pending = managers.filter(m => !m.is_active).length;
      console.log(`\n📊 Summary:`);
      console.log(`   Total Managers: ${managers.length}`);
      console.log(`   Pending Activation: ${pending}`);
      console.log(`   Active: ${managers.length - pending}`);
    }

    // Check roles table
    console.log('\n🔍 Checking roles...');
    const rolesResult = await pool.query('SELECT * FROM role ORDER BY role_id');
    console.log('Available roles:');
    rolesResult.rows.forEach(role => {
      console.log(`   ${role.role_id}. ${role.role_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkManagers();
