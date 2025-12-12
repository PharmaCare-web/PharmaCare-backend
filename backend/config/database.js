const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const useSSL = process.env.DB_SSL === 'true';

// Log DB connection info (non-sensitive) to help diagnose issues
console.log('🛠️ Database config:');
console.log(`   host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   port: ${process.env.DB_PORT || 5432}`);
console.log(`   user: ${process.env.DB_USER || 'postgres'}`);
console.log(`   db:   ${process.env.DB_NAME || 'pharmacare'}`);
console.log(`   ssl:  ${useSSL ? 'enabled' : 'disabled'}`);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pharmacare',
  ssl: useSSL
    ? {
        rejectUnauthorized: false
      }
    : false,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

// Test database connection
pool.query('SELECT NOW()')
  .then(result => {
    console.log('✅ Database connected successfully');
    console.log('📅 Database time:', result.rows[0].now);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your database configuration in .env file');
    if (process.env.NODE_ENV === 'development') {
      console.error('Make sure PostgreSQL is running and database exists');
    } else {
      console.error('Make sure your production database is accessible and credentials are correct');
    }
  });

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Create a wrapper function that matches MySQL's execute pattern
// This allows existing code to work without changes
const originalQuery = pool.query.bind(pool);

pool.execute = async (query, params = []) => {
  try {
    // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
    let pgQuery = query;
    let paramIndex = 1;
    const pgParams = [];
    
    // Replace ? with $1, $2, etc.
    pgQuery = pgQuery.replace(/\?/g, () => {
      if (paramIndex - 1 < params.length) {
        pgParams.push(params[paramIndex - 1]);
      }
      return `$${paramIndex++}`;
    });
    
    const result = await originalQuery(pgQuery, pgParams);
    // Return in format similar to MySQL: [rows, fields]
    // PostgreSQL returns { rows, fields }, MySQL returns [rows, fields]
    return [result.rows, result.fields || []];
  } catch (error) {
    throw error;
  }
};

module.exports = pool;
