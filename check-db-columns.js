/**
 * Check database column names
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
});

async function checkColumns() {
  let client;
  try {
    client = await pool.connect();
    
    // Check users table
    const usersCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%user%id%'
      ORDER BY column_name
    `);
    
    console.log('📊 Users table columns:');
    usersCols.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type})`);
    });
    
    // Check sale table
    const saleCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sale' 
      AND column_name LIKE '%user%id%'
      ORDER BY column_name
    `);
    
    if (saleCols.rows.length > 0) {
      console.log('\n📊 Sale table columns:');
      saleCols.rows.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

checkColumns();

