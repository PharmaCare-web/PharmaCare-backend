/**
 * Init DB: run PostgreSQL schema from backend.
 * Usage: node initDb.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Require critical envs
const required = (key) => {
  if (!process.env[key]) throw new Error(`Missing required env: ${key}`);
  return process.env[key];
};

const host = required('DB_HOST');
const port = parseInt(process.env.DB_PORT || '5432', 10);
const user = required('DB_USER');
const password = required('DB_PASSWORD');
const database = required('DB_NAME');
const useSSL = (process.env.DB_SSL || '').toLowerCase() === 'true';

console.log('🛠️ Init DB with config:');
console.log(`   host: ${host}`);
console.log(`   port: ${port}`);
console.log(`   user: ${user}`);
console.log(`   db:   ${database}`);
console.log(`   ssl:  ${useSSL ? 'enabled' : 'disabled'}`);

const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 5,
  connectionTimeoutMillis: 20000,
});

async function run() {
  const schemaPath = path.join(__dirname, '../database/postgresql_schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('🚀 Executing schema (single pass, will ignore already-exists errors)...');
    try {
      await client.query(sql);
      console.log('✅ Schema applied successfully');
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate key') ||
        msg.includes('trigger') && msg.includes('exists')
      ) {
        console.warn(`⚠️  Schema execution hit existing objects: ${err.message}`);
        console.warn('   Database is likely already initialized. Continuing.');
      } else {
        throw err;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('❌ Init DB failed:', err.message);
  process.exit(1);
});

