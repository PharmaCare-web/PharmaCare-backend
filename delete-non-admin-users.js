// Delete all users except Admin from the database
require('dotenv').config();
const pool = require('./config/database');

async function deleteNonAdminUsers() {
  console.log('🗑️  Deleting all non-Admin users from database...\n');

  try {
    // First, let's see what users exist
    console.log('📋 Current users in database:');
    const [allUsers] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, r.role_name 
       FROM users u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       ORDER BY u.user_id`
    );

    if (allUsers.length === 0) {
      console.log('   No users found in database.\n');
      return;
    }

    console.log(`   Found ${allUsers.length} users:\n`);
    allUsers.forEach(user => {
      console.log(`   - ID: ${user.user_id} | ${user.full_name} | ${user.email} | Role: ${user.role_name || 'N/A'}`);
    });
    console.log();

    // Get Admin role_id
    const [adminRole] = await pool.execute(
      "SELECT role_id FROM role WHERE role_name = 'Admin' LIMIT 1"
    );

    if (adminRole.length === 0) {
      console.error('❌ Admin role not found in database!');
      console.error('   Cannot proceed without Admin role.\n');
      process.exit(1);
    }

    const adminRoleId = adminRole[0].role_id;
    console.log(`ℹ️  Admin role_id: ${adminRoleId}\n`);

    // Find admin users (should keep these)
    const [adminUsers] = await pool.execute(
      'SELECT user_id, full_name, email FROM users WHERE role_id = ?',
      [adminRoleId]
    );

    console.log('✅ Admin users (will be KEPT):');
    if (adminUsers.length === 0) {
      console.log('   ⚠️  WARNING: No admin users found! Database will be empty after deletion.\n');
    } else {
      adminUsers.forEach(user => {
        console.log(`   - ${user.full_name} (${user.email})`);
      });
      console.log();
    }

    // Find non-admin users (will be deleted)
    const [nonAdminUsers] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, r.role_name 
       FROM users u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       WHERE u.role_id != ? OR u.role_id IS NULL`,
      [adminRoleId]
    );

    if (nonAdminUsers.length === 0) {
      console.log('✅ No non-admin users to delete. Database already clean!\n');
      process.exit(0);
    }

    console.log(`🗑️  Non-admin users (will be DELETED): ${nonAdminUsers.length} users\n`);
    nonAdminUsers.forEach(user => {
      console.log(`   - ${user.full_name} (${user.email}) - Role: ${user.role_name || 'N/A'}`);
    });
    console.log();

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete all non-admin users!');
    console.log('   This action cannot be undone.\n');

    // Delete non-admin users
    console.log('🚀 Executing deletion...\n');

    const [deleteResult] = await pool.execute(
      'DELETE FROM users WHERE role_id != ? OR role_id IS NULL',
      [adminRoleId]
    );

    console.log(`✅ Deletion complete!`);
    console.log(`   Deleted ${deleteResult.affectedRows} users\n`);

    // Verify final state
    console.log('📊 Final database state:');
    const [remainingUsers] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, r.role_name 
       FROM users u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       ORDER BY u.user_id`
    );

    console.log(`   Total users remaining: ${remainingUsers.length}\n`);
    remainingUsers.forEach(user => {
      console.log(`   ✅ ${user.full_name} (${user.email}) - Role: ${user.role_name || 'N/A'}`);
    });
    console.log();

    console.log('✅ SUCCESS! All non-admin users have been deleted.\n');

  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the deletion
deleteNonAdminUsers();
