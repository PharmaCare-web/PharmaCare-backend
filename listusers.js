const { Pool } = require('pg');

// Render PostgreSQL connection
const pool = new Pool({
  user: 'pharmacare_user',         // Replace with your Render DB username
  host: 'dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com',         // e.g., db-abcdefg.render.com
  database: 'pharmacare',           // Your database name
  password: '6qS1ylyQXCvF6FVMhGDrsMTAxauAh1x5', // Replace with your Render DB password
  port: 5432,
  ssl: {
    rejectUnauthorized: false       // Required for Render hosted Postgres
  }
});

async function listUsers() {
  try {
    // Query all users
    const result = await pool.query('SELECT * FROM users'); 
    console.table(result.rows); // Prints a table in the console
  } catch (err) {
    console.error('Error retrieving users:', err);
  } finally {
    await pool.end(); // Close connection pool
  }
}

// Run the function
listUsers();
