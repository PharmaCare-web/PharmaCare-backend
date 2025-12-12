// Script to generate bcrypt hash for admin password
// Run: node database/generate_admin_password.js

const bcrypt = require('bcryptjs');

const password = 'Admin@123';  // Change this to your desired password
const hash = bcrypt.hashSync(password, 10);

console.log('='.repeat(60));
console.log('Admin Password Hash Generator');
console.log('='.repeat(60));
console.log('\nPassword:', password);
console.log('Hash:', hash);
console.log('\nCopy this hash to database/create_admin_account.sql');
console.log('='.repeat(60));

