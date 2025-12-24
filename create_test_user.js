// Script to create a test user directly in the database
// Run with: node create_test_user.js

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pharmacare'
    });

    console.log('✅ Connected to database\n');

    // Test user credentials
    const testUser = {
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
      role_id: 3,
      branch_id: 1
    };

    // Check if user already exists
    const [existing] = await connection.execute(
      'SELECT user_id, email FROM user WHERE email = ?',
      [testUser.email]
    );

    if (existing.length > 0) {
      console.log('ℹ️  User already exists:', testUser.email);
      console.log('   User ID:', existing[0].user_id);
      console.log('\n✅ You can now login with:');
      console.log('   Email:', testUser.email);
      console.log('   Password:', testUser.password);
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(testUser.password, saltRounds);

    // Check if role and branch exist
    const [roles] = await connection.execute('SELECT role_id FROM role WHERE role_id = ?', [testUser.role_id]);
    if (roles.length === 0) {
      console.error('❌ Error: Role ID', testUser.role_id, 'does not exist');
      console.log('   Please run the database schema first');
      return;
    }

    const [branches] = await connection.execute('SELECT branch_id FROM branch WHERE branch_id = ?', [testUser.branch_id]);
    if (branches.length === 0) {
      console.error('❌ Error: Branch ID', testUser.branch_id, 'does not exist');
      console.log('   Please run the database schema first');
      return;
    }

    // Insert user (try with is_active, fallback without it)
    let result;
    try {
      [result] = await connection.execute(
        'INSERT INTO user (full_name, email, password, role_id, branch_id, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [testUser.full_name, testUser.email, hashedPassword, testUser.role_id, testUser.branch_id, true]
      );
    } catch (insertError) {
      // If is_active column doesn't exist, insert without it
      if (insertError.code === 'ER_BAD_FIELD_ERROR') {
        [result] = await connection.execute(
          'INSERT INTO user (full_name, email, password, role_id, branch_id) VALUES (?, ?, ?, ?, ?)',
          [testUser.full_name, testUser.email, hashedPassword, testUser.role_id, testUser.branch_id]
        );
      } else {
        throw insertError;
      }
    }

    console.log('✅ Test user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email:', testUser.email);
    console.log('   Password:', testUser.password);
    console.log('\n🔗 Test with Thunder Client:');
    console.log('   POST http://localhost:5000/api/auth/login');
    console.log('   Body: { "email": "test@example.com", "password": "TestPass123" }');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Check your database credentials in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database "pharmacare" does not exist. Run schema.sql first');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Cannot connect to database. Make sure MySQL is running in XAMPP');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestUser();

