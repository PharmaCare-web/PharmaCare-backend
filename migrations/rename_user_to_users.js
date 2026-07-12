/**
 * Renames PostgreSQL table "user" -> users for code compatibility.
 * Safe to run multiple times.
 */

const pool = require('../config/database');

async function renameUserTable() {
  const client = await pool.connect();

  try {
    const { rows } = await client.query(`
      SELECT
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'user'
        ) AS has_user_table,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) AS has_users_table
    `);

    const { has_user_table, has_users_table } = rows[0];

    if (has_user_table && !has_users_table) {
      await client.query('ALTER TABLE "user" RENAME TO users');
      console.log('✅ Database migration: renamed table "user" to users');
      return { migrated: true };
    }

    if (has_users_table) {
      console.log('✅ Database migration: users table already exists');
      return { migrated: false, reason: 'users_exists' };
    }

    console.warn('⚠️  Database migration: neither "user" nor users table found');
    return { migrated: false, reason: 'table_missing' };
  } finally {
    client.release();
  }
}

module.exports = { renameUserTable };

if (require.main === module) {
  renameUserTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    });
}
