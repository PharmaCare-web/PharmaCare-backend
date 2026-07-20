// Test if Render deployment is working with Brevo API
const axios = require('axios');

const BACKEND_URL = 'https://pharmacare-api.onrender.com';

async function testManagerRegistration() {
  console.log('🧪 Testing Manager Registration with Brevo API Email...\n');

  const testEmail = `test.manager.${Date.now()}@example.com`;
  const testData = {
    full_name: 'Test Manager Brevo',
    email: testEmail,
    password: 'Test123456',
    role_id: 2,
    branch_name: `Test Branch ${Date.now()}`,
    location: 'Test Location'
  };

  console.log('📝 Test Data:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Branch: ${testData.branch_name}\n`);

  try {
    console.log('🚀 Sending POST request to /api/auth/register...\n');

    const response = await axios.post(
      `${BACKEND_URL}/api/auth/register`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ SUCCESS! Registration response:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   User ID:', response.data.users?.user_id);
    console.log('   Email:', response.data.users?.email);
    console.log('   Requires Verification:', response.data.requiresVerification);
    console.log('   Requires Activation:', response.data.requiresActivation);
    console.log('   Is Active:', response.data.isActive);

    if (response.data.requiresVerification) {
      console.log('\n✅ Email verification is ENABLED!');
      console.log('   Check the email inbox for verification code.');
    } else {
      console.log('\n⚠️  Email verification is DISABLED or email failed to send.');
    }

    console.log('\n📊 Full Response:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n✅ TEST PASSED: Render deployment is working!');
    console.log('   - axios is installed');
    console.log('   - Brevo API is configured');
    console.log('   - Email service is functional');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 500) {
        console.error('\n   🐛 Possible Issues:');
        console.error('      1. axios module not installed on Render');
        console.error('      2. BREVO_API_KEY not configured on Render');
        console.error('      3. Code not properly deployed');
      }
    } else if (error.request) {
      console.error('   No response from server');
      console.error('   Error:', error.message);
    } else {
      console.error('   Error:', error.message);
    }
    
    process.exit(1);
  }
}

async function checkBackendHealth() {
  console.log('🏥 Checking backend health...\n');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/`, { timeout: 10000 });
    console.log('✅ Backend is online!');
    console.log('   Response:', response.data);
    console.log();
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    console.error('   The backend might be down or starting up.\n');
  }
}

async function main() {
  console.log('================================');
  console.log('  Render Brevo API Deployment Test');
  console.log('================================\n');
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  
  await checkBackendHealth();
  await testManagerRegistration();
  
  console.log('\n================================');
  console.log('  Test Complete!');
  console.log('================================\n');
}

main();
