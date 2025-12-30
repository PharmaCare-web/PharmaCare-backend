// test-email.js
require('dotenv').config();
const sendEmail = require('./utils/emailService.js'); // Update this path!

const runTest = async () => {
    console.log("🚀 Starting Brevo API Test...");
    
    try {
        await sendEmail({
            email: 'dagmawitadeferes@gmail.com', // Change to your own email
            subject: 'Local Test Run',
            message: 'If you are reading this, your Brevo API setup is correct!',
            html: '<h1>Success!</h1><p>The API is working locally.</p>'
        });
        console.log("✅ Test passed! You can safely commit and deploy to Render.");
    } catch (error) {
        console.error("❌ Test failed. See the error details above.");
    }
};

runTest();