// Quick test script for login endpoint
// Run with: node test_login.js

const fetch = require('node-fetch');

async function testLogin() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing Login Endpoint...\n');

  // Test 1: Login with valid credentials (you need to register a user first)
  console.log('Test 1: Login with credentials');
  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'selam@example.com',
        password: 'SecurePass123'
      })
    });

    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginData, null, 2));
    
    if (loginData.success && loginData.token) {
      console.log('✅ Login successful! Token received.');
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Login with invalid credentials
  console.log('Test 2: Login with invalid password');
  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'selam@example.com',
        password: 'WrongPassword123'
      })
    });

    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginData, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Login with missing email
  console.log('Test 3: Login with missing email');
  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'SecurePass123'
      })
    });

    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginData, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Health check
  console.log('Test 4: Health check');
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('Status:', healthRes.status);
    console.log('Response:', JSON.stringify(healthData, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Make sure the server is running on port 5000');
  }
}

testLogin();

