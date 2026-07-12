/**
 * Test Database Connection
 * Usage: node test-db-connection.js
 */

const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Testing Database Connection...\n');

console.log('📋 Current .env Configuration:');
console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || 'NOT SET'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
console.log(`   DB_SSL: ${process.env.DB_SSL || 'NOT SET'}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'NOT SET'}`);
console.log('');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  let client;
  
  try {
    console.log('🔌 Attempting to connect...');
    client = await pool.connect();
    console.log('✅ Connection successful!\n');
    
    // Test query
    const result = await client.query('SELECT NOW(), version()');
    console.log('📊 Database Info:');
    console.log(`   Time: ${result.rows[0].now}`);
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}`);
    console.log('');
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('📦 Existing Tables:');
      tables.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. Database needs initialization.');
    }
    
    console.log('\n✅ Connection test passed! Your database credentials are correct.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed!\n');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Possible issues:');
      console.error('   - DB_HOST is incorrect');
      console.error('   - Check your Render database hostname');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Possible issues:');
      console.error('   - Database is not running');
      console.error('   - DB_PORT is incorrect (should be 5432)');
      console.error('   - Firewall blocking connection');
    } else if (error.message.includes('password')) {
      console.error('💡 Possible issues:');
      console.error('   - DB_PASSWORD is incorrect');
      console.error('   - DB_USER is incorrect');
      console.error('   - Check your Render database credentials');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('💡 Possible issues:');
      console.error('   - DB_NAME is incorrect');
      console.error('   - Database was not created on Render');
    } else if (error.message.includes('SSL') || error.message.includes('terminated')) {
      console.error('💡 Possible issues:');
      console.error('   - SSL configuration issue');
      console.error('   - Try setting DB_SSL=true in .env');
      console.error('   - Or connection was interrupted');
    }
    
    console.error('\n📝 Steps to fix:');
    console.error('   1. Go to Render Dashboard → Your PostgreSQL database');
    console.error('   2. Click "Connect" → "External Connection"');
    console.error('   3. Copy the EXACT credentials');
    console.error('   4. Update your .env file with those credentials');
    console.error('   5. Run this test again: node test-db-connection.js');
    
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testConnection();
