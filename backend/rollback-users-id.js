const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('🔄 Rolling back users_id → user_id');

    await pool.query(`ALTER TABLE users RENAME COLUMN users_id TO user_id;`);
    await pool.query(`ALTER TABLE sale RENAME COLUMN users_id TO user_id;`);
    await pool.query(`ALTER TABLE refund RENAME COLUMN users_id TO user_id;`);
    await pool.query(`ALTER TABLE password_reset RENAME COLUMN users_id TO user_id;`);

    console.log('✅ Rollback complete');
  } catch (err) {
    console.error('❌ Rollback failed:', err.message);
  } finally {
    await pool.end();
  }
})();
