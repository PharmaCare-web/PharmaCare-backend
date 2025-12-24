// Migration: Add index on sale.status for better query performance
// Run this migration to improve cashier payment query performance

const pool = require('../config/database');
require('dotenv').config();

async function addSaleStatusIndex() {
  let client;
  
  try {
    console.log('🔄 Starting migration: Add index on sale.status...');
    
    // Get a connection
    client = await pool.connect();
    
    // Create the index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sale_status ON sale(status);
    `);
    
    console.log('✅ Index created successfully: idx_sale_status');
    console.log('📊 This index will improve query performance for:');
    console.log('   - Cashier pending payments queries');
    console.log('   - Sales filtered by status');
    
    // Verify the index was created
    const result = await client.query(`
      SELECT 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename = 'sale' 
      AND indexname = 'idx_sale_status';
    `);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Index details:');
      console.log(`   Name: ${result.rows[0].indexname}`);
      console.log(`   Definition: ${result.rows[0].indexdef}`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    // Don't close the pool, let it stay open for other connections
    process.exit(0);
  }
}

// Run the migration
addSaleStatusIndex();

