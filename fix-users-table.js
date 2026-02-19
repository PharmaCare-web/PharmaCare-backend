#!/usr/bin/env node

/**
 * Fix Users Table Name
 * Creates a view 'users' that points to the 'user' table
 * This allows the code to use 'users' while the actual table is 'user'
 */

const { Pool } = require('pg');

// Use the exact database credentials
const pool = new Pool({
  host: 'dpg-d66s40q4d50c73c0u6ng-a.frankfurt-postgres.render.com',
  port: 5432,
  user: 'pharmacare_user',
  password: 'gkhdLaB3WtXOhFkaXxqhNOPQyUMIU7kA',
  database: 'pharmacare_i5sz',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixUsersTable() {
  console.log('🔧 Fixing users table reference...\n');
  
  try {
    // Test connection
    console.log('📡 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected!\n');
    
    // Drop the view if it exists
    console.log('🗑️  Dropping existing users view if it exists...');
    await pool.query('DROP VIEW IF EXISTS users CASCADE');
    console.log('✅ Done\n');
    
    // Create a view that makes 'users' point to 'user' table
    console.log('🔨 Creating users view...');
    await pool.query(`
      CREATE VIEW users AS 
      SELECT * FROM "user"
    `);
    console.log('✅ View created successfully!\n');
    
    // Test the view
    console.log('🔍 Testing the view...');
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ View works! Found ${result.rows[0].count} users\n`);
    
    // Show admin account
    const admin = await pool.query(`
      SELECT u.full_name, u.email, r.role_name 
      FROM users u 
      LEFT JOIN role r ON u.role_id = r.role_id 
      WHERE u.email = 'admin@pharmacare.com'
    `);
    
    if (admin.rows.length > 0) {
      console.log('👤 Admin account accessible:');
      console.log(`   ✓ ${admin.rows[0].full_name} (${admin.rows[0].email})`);
      console.log(`   ✓ Role: ${admin.rows[0].role_name}\n`);
    }
    
    console.log('🎉 Fix completed successfully!');
    console.log('   Your code can now use "users" table name');
    console.log('   The view automatically maps to the "user" table\n');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixUsersTable();