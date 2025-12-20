const { Pool } = require('pg');
require('dotenv').config();

// Strong validation for required env vars (especially in production)
const required = (key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env: ${key}`);
    throw new Error(`Missing required env: ${key}`);
  }
  return process.env[key];
};

const isProd = process.env.NODE_ENV === 'production';
const host = isProd ? required('DB_HOST') : process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'pharmacare';
const useSSL = (process.env.DB_SSL || '').toLowerCase() === 'true';

console.log('🛠️ Database config:');
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
  ssl: useSSL
    ? {
        rejectUnauthorized: false,
      }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

// Minimal retry on initial connect
async function testConnection(retries = 3, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Database connected successfully');
      console.log('📅 Database time:', result.rows[0].now);
      return;
    } catch (err) {
      console.error(`❌ DB connect attempt ${i}/${retries} failed: ${err.message}`);
      if (i === retries) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

testConnection().catch((err) => {
  console.error('❌ Database connection failed after retries:', err.message);
  console.error('Please verify DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_SSL in .env');
  process.exit(1);
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// MySQL-compatible execute wrapper
const originalQuery = pool.query.bind(pool);
pool.execute = async (query, params = []) => {
  let pgQuery = query;
  let paramIndex = 1;
  const pgParams = [];

  pgQuery = pgQuery.replace(/\?/g, () => {
    if (paramIndex - 1 < params.length) {
      pgParams.push(params[paramIndex - 1]);
    }
    return `$${paramIndex++}`;
  });

  const result = await originalQuery(pgQuery, pgParams);
  return [result.rows, result.fields || []];
};

module.exports = pool;
