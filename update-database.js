/**
 * Database Update Script
 * Creates the notification table if it doesn't exist
 * 
 * Usage:
 *   node update-database.js
 * 
 * Make sure your .env file has the correct database credentials
 */

// Use the same database configuration as the main app
const pool = require('./config/database');

async function updateDatabase() {
  // Wait a bit for the database connection to be established
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('🔄 Starting database update...\n');
  console.log(`📊 Database: ${process.env.DB_NAME || 'pharmacare'}`);
  console.log(`🏠 Host: ${process.env.DB_HOST || 'localhost'}\n`);

  try {
    // Create notification table
    console.log('📝 Creating notification table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification (
        notification_id SERIAL PRIMARY KEY,
        branch_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Notification table created/verified\n');

    // Create indexes
    console.log('📝 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_branch_id ON notification(branch_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
    `);
    console.log('✅ Indexes created/verified\n');

    // Verify table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'notification';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verification: Notification table exists!\n');
      
      // Show table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'notification'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('⚠️  Warning: Table verification failed');
    }

    console.log('\n🎉 Database update completed successfully!');

  } catch (error) {
    console.error('\n❌ Error updating database:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === '42P01') {
      console.error('💡 Tip: This might mean a referenced table (branch) doesn\'t exist.');
    } else if (error.code === '23503') {
      console.error('💡 Tip: Foreign key constraint failed. Check if branch table exists.');
    } else if (error.code === '28P01') {
      console.error('💡 Tip: Authentication failed. Check your database credentials in .env file.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Tip: Connection refused. Check if database is running and credentials are correct.');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the update
updateDatabase();

