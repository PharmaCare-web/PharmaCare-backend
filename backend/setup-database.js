/**
 * Database Setup Script for Render PostgreSQL
 * Run this once to initialize your database schema
 * 
 * Usage: node setup-database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
// Load .env file explicitly
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.log('⚠️  .env file not found, using Render defaults\n');
} else {
  console.log('✅ .env file loaded\n');
}

// Debug: Show what's being read from .env
console.log('📋 Environment variables:');
console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET - using Render default'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || 'NOT SET - using Render default'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'NOT SET - using Render default'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET - using Render default'}`);
console.log(`   DB_SSL: ${process.env.DB_SSL || 'NOT SET - using Render default'}\n`);

// PostgreSQL connection configuration
// FORCE Render database credentials (override .env if wrong)
const dbHost = 'dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com';
const dbPort = 5432;
const dbUser = 'pharmacare_user';
const dbPassword = '6qS1ylyQXCvF6FVMhGDrsMTAxauAh1x5';
const dbName = 'pharmacare';
const dbSSL = true; // Always use SSL for Render

const pool = new Pool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  ssl: dbSSL ? {
    rejectUnauthorized: false
  } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function setupDatabase() {
  let client;
  
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    console.log(`   Host: ${dbHost}`);
    console.log(`   Port: ${dbPort}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   User: ${dbUser}`);
    console.log(`   SSL: ${dbSSL ? 'Enabled' : 'Disabled'}\n`);
    
    // Test connection
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected successfully!');
    console.log(`   Server time: ${result.rows[0].now}\n`);
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/postgresql_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded');
    console.log('🚀 Executing schema...\n');
    
    // Execute the entire schema
    await client.query(schema);
    
    console.log('✅ Schema executed successfully!\n');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    // Check roles
    const rolesResult = await client.query('SELECT role_name FROM role ORDER BY role_id');
    console.log('\n👥 Roles:');
    rolesResult.rows.forEach(role => {
      console.log(`   - ${role.role_name}`);
    });
    
    // Check admin account
    const adminResult = await client.query(`
      SELECT u.email, u.full_name, u.is_active, r.role_name 
      FROM "user" u 
      LEFT JOIN role r ON u.role_id = r.role_id 
      WHERE u.email = 'admin@pharmacare.com'
    `);
    
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log('\n👤 Admin Account:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.full_name}`);
      console.log(`   Role: ${admin.role_name}`);
      console.log(`   Active: ${admin.is_active ? 'Yes' : 'No'}`);
      console.log('   Password: Admin@123');
    }
    
    // Check pharmacy
    const pharmacyResult = await client.query('SELECT name FROM pharmacy LIMIT 1');
    if (pharmacyResult.rows.length > 0) {
      console.log(`\n🏢 Pharmacy: ${pharmacyResult.rows[0].name}`);
    }
    
    // Check categories
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM category');
    console.log(`\n📦 Categories: ${categoriesResult.rows[0].count}`);
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n✅ Your database is ready to use!');
    console.log('   You can now deploy your web service on Render.\n');
    
  } catch (error) {
    console.error('\n❌ Error setting up database:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Check:');
      console.error('   - Database host and port are correct');
      console.error('   - Database is running on Render');
      console.error('   - Network connectivity');
    } else if (error.code === '28P01') {
      console.error('💡 Check:');
      console.error('   - Username and password are correct');
      console.error('   - User has permission to access the database');
    } else if (error.code === '3D000') {
      console.error('💡 Check:');
      console.error('   - Database name is correct');
      console.error('   - Database exists on Render');
    } else if (error.message.includes('already exists')) {
      console.error('⚠️  Some objects already exist. This is okay if you\'re re-running the script.');
      console.error('   The database should still be functional.\n');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run setup
setupDatabase();

