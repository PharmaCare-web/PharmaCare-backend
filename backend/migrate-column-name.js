/**
 * Migration Script: Rename 'user_id' column to 'users_id' in users table
 * Run this once to update your existing database
 * 
 * Usage: node migrate-column-name.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: (process.env.DB_SSL || 'true').toLowerCase() === 'true' ? {
    rejectUnauthorized: false
  } : false,
  connectionTimeoutMillis: 30000,
});

async function migrateColumn() {
  let client;
  
  try {
    console.log('🔌 Connecting to database...\n');
    
    client = await pool.connect();
    
    // Check if users_id column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('user_id', 'users_id')
    `);
    
    const hasUserId = checkColumn.rows.some(r => r.column_name === 'user_id');
    const hasUsersId = checkColumn.rows.some(r => r.column_name === 'users_id');
    
    console.log('📊 Current state:');
    console.log(`   'user_id' column exists: ${hasUserId ? '✅ Yes' : '❌ No'}`);
    console.log(`   'users_id' column exists: ${hasUsersId ? '✅ Yes' : '❌ No'}\n`);
    
    if (hasUsersId && !hasUserId) {
      console.log('✅ Migration already complete! Column is already named "users_id".\n');
      return;
    }
    
    if (!hasUserId) {
      console.log('⚠️  Neither column exists. Table might not be created yet.\n');
      return;
    }
    
    console.log('🔄 Starting migration: user_id → users_id\n');
    
    // Step 1: Rename column in users table
    console.log('1️⃣  Renaming column in users table...');
    await client.query('ALTER TABLE users RENAME COLUMN user_id TO users_id');
    console.log('   ✅ Column renamed\n');
    
    // Step 2: Update foreign key constraints in other tables
    console.log('2️⃣  Updating foreign key constraints...');
    
    // Update sale table
    try {
      await client.query('ALTER TABLE sale RENAME COLUMN user_id TO users_id');
      console.log('   ✅ sale.user_id → sale.users_id');
    } catch (e) {
      if (!e.message.includes('does not exist')) throw e;
      console.log('   ⚠️  sale table has no user_id column (skipping)');
    }
    
    // Update refund table
    try {
      await client.query('ALTER TABLE refund RENAME COLUMN user_id TO users_id');
      console.log('   ✅ refund.user_id → refund.users_id');
    } catch (e) {
      if (!e.message.includes('does not exist')) throw e;
      console.log('   ⚠️  refund table has no user_id column (skipping)');
    }
    
    // Update password_reset table
    try {
      await client.query('ALTER TABLE password_reset RENAME COLUMN user_id TO users_id');
      console.log('   ✅ password_reset.user_id → password_reset.users_id');
    } catch (e) {
      if (!e.message.includes('does not exist')) throw e;
      console.log('   ⚠️  password_reset table has no user_id column (skipping)');
    }
    
    console.log('\n✅ Migration complete!');
    console.log('   All columns renamed from user_id to users_id.\n');
    
  } catch (error) {
    console.error('\n❌ Migration error:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

migrateColumn();

