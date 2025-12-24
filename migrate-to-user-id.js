/**
 * Migration Script: Rename 'users_id' column to 'user_id' in all tables
 * Run this once to update your existing database to match the schema
 * 
 * Usage: node migrate-to-user-id.js
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
    
    // Check current state
    const checkUsers = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('user_id', 'users_id')
    `);
    
    const hasUserId = checkUsers.rows.some(r => r.column_name === 'user_id');
    const hasUsersId = checkUsers.rows.some(r => r.column_name === 'users_id');
    
    console.log('📊 Current state in users table:');
    console.log(`   'user_id' column exists: ${hasUserId ? '✅ Yes' : '❌ No'}`);
    console.log(`   'users_id' column exists: ${hasUsersId ? '✅ Yes' : '❌ No'}\n`);
    
    if (hasUserId && !hasUsersId) {
      console.log('✅ Migration already complete! Column is already named "user_id".\n');
      return;
    }
    
    if (!hasUsersId) {
      console.log('⚠️  Neither column exists. Table might not be created yet.\n');
      return;
    }
    
    console.log('🔄 Starting migration: users_id → user_id\n');
    
    // Step 1: Rename column in users table
    console.log('1️⃣  Renaming column in users table...');
    await client.query('ALTER TABLE users RENAME COLUMN users_id TO user_id');
    console.log('   ✅ users.users_id → users.user_id\n');
    
    // Step 2: Update foreign key constraints in other tables
    console.log('2️⃣  Updating foreign key columns in other tables...');
    
    // Update sale table
    try {
      const checkSale = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sale' 
        AND column_name = 'users_id'
      `);
      if (checkSale.rows.length > 0) {
        await client.query('ALTER TABLE sale RENAME COLUMN users_id TO user_id');
        console.log('   ✅ sale.users_id → sale.user_id');
      }
    } catch (e) {
      if (!e.message.includes('does not exist')) throw e;
      console.log('   ⚠️  sale table has no users_id column (skipping)');
    }
    
    // Update refund table
    try {
      const checkRefund = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'refund' 
        AND column_name = 'users_id'
      `);
      if (checkRefund.rows.length > 0) {
        await client.query('ALTER TABLE refund RENAME COLUMN users_id TO user_id');
        console.log('   ✅ refund.users_id → refund.user_id');
      }
    } catch (e) {
      if (!e.message.includes('does not exist')) throw e;
      console.log('   ⚠️  refund table has no users_id column (skipping)');
    }
    
    // Update password_reset table
    try {
      const checkPasswordReset = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'password_reset' 
        AND column_name = 'users_id'
      `);
      if (checkPasswordReset.rows.length > 0) {
        await client.query('ALTER TABLE password_reset RENAME COLUMN users_id TO user_id');
        console.log('   ✅ password_reset.users_id → password_reset.user_id');
      }
    } catch (e) {
      if (!e.message.includes('does not exist')) throw e;
      console.log('   ⚠️  password_reset table has no users_id column (skipping)');
    }
    
    console.log('\n✅ Migration complete!');
    console.log('   All columns renamed from users_id to user_id.');
    console.log('   Your database now matches the schema.\n');
    
  } catch (error) {
    console.error('\n❌ Migration error:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === '42P07') {
      console.error('💡 Table already exists. This might be okay if migration was already done.\n');
    } else if (error.code === '3D000') {
      console.error('💡 Check your database name in .env file.\n');
    }
    
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

migrateColumn();

