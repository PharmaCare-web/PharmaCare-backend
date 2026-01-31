// Migration Runner Script
// This script runs the audit_trail and refund_policy migration
// Usage: node run-migration.js

const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

async function runMigration() {
  console.log('🔄 Starting database migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'create_audit_trail_and_refund_policy.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...\n');

    // Execute the entire SQL file
    // PostgreSQL can handle multiple statements in one query
    try {
      await pool.query(migrationSQL);
      console.log('✅ Migration SQL executed successfully\n');
    } catch (error) {
      // Check if it's a "already exists" error (which is OK for IF NOT EXISTS)
      if (error.message && (
        error.message.includes('already exists') ||
        error.message.includes('duplicate') ||
        error.code === '42P07' || // duplicate_table
        error.code === '42710'    // duplicate_object
      )) {
        console.log('ℹ️  Some objects already exist (this is OK)\n');
      } else {
        // If it's a syntax error, try executing statements one by one
        console.log('⚠️  Bulk execution failed, trying individual statements...\n');
        
        // Simple split by semicolon (for most cases this works)
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && !s.toUpperCase().startsWith('SELECT'));

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          try {
            await pool.query(statement);
            console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
          } catch (stmtError) {
            // Ignore "already exists" errors
            if (stmtError.message && (
              stmtError.message.includes('already exists') ||
              stmtError.code === '42P07' ||
              stmtError.code === '42710'
            )) {
              console.log(`ℹ️  Statement ${i + 1} skipped (already exists)`);
              continue;
            }
            throw stmtError;
          }
        }
        console.log('');
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying tables were created...\n');
    
    const [tables] = await pool.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('audit_trail', 'refund_policy')
      ORDER BY table_name
    `);

    if (tables.length === 2) {
      console.log('✅ Migration completed successfully!\n');
      console.log('📊 Created tables:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('\n✨ You can now use the audit trail and refund policy endpoints!');
    } else {
      console.log('⚠️  Warning: Some tables may not have been created.');
      console.log(`   Expected 2 tables, found ${tables.length}`);
      if (tables.length > 0) {
        console.log('   Created tables:');
        tables.forEach(table => {
          console.log(`     - ${table.table_name}`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error code:', error.code);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
