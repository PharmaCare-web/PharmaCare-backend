require('dotenv').config();
const pool = require('./config/database');

async function listUsers() {
  try {
    // Query all users from "user" table (PostgreSQL)
    const [users] = await pool.execute('SELECT * FROM "user"'); 
    console.table(users); // Prints a table in the console
  } catch (err) {
    console.error('Error retrieving users:', err);
  } finally {
    await pool.end(); // Close connection pool
  }
}

// Run the function
listUsers();
