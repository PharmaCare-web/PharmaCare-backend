const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT user_id, email, full_name, role_id, branch_id,
             is_email_verified, is_active,
             verification_code, verification_code_expires,
             created_at, last_login
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `);
    console.log(rows);
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
})();