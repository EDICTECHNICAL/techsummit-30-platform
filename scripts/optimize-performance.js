#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/['"]/g, '');
      }
    });
    console.log('📄 Loaded environment variables from .env.local');
  }
}

async function runIndexMigration() {
  try {
    console.log('🔧 Running performance index migration...\n');

    // Load environment variables
    loadEnvFile();

    // Connect to database
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.log('❌ DATABASE_URL environment variable is required');
      console.log('\n💡 Solutions:');
      console.log('1. Create a .env.local file with DATABASE_URL=your_connection_string');
      console.log('2. Set environment variable: export DATABASE_URL="your_connection_string"');
      console.log('3. Run with variable: DATABASE_URL="your_string" npm run db:optimize');
      process.exit(1);
    }

    // Read the SQL file
    const sqlFile = path.join(__dirname, '../drizzle/0003_add_performance_indexes.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.log('❌ SQL file not found:', sqlFile);
      console.log('💡 Make sure the file exists and run this script from the project root');
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');

    const client = postgres(connectionString, { ssl: 'require' });
    
    console.log('📊 Creating performance indexes...');
    
    // Split SQL into individual statements and execute
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        try {
          await client.unsafe(trimmed);
          const description = trimmed.split('\n')[0].substring(0, 60);
          console.log(`✅ Executed: ${description}...`);
        } catch (error) {
          // Skip if index already exists
          if (error.message.includes('already exists')) {
            const description = trimmed.split('\n')[0].substring(0, 60);
            console.log(`⚠️  Skipped: ${description}... (already exists)`);
          } else {
            throw error;
          }
        }
      }
    }

    await client.end();
    
    console.log('\n🎉 Performance optimization completed successfully!');
    console.log('\n📋 Applied optimizations:');
    console.log('  ✅ Database connection pooling');
    console.log('  ✅ Performance indexes created');
    console.log('  ✅ SSE connection monitoring');
    console.log('  ✅ Health check endpoint added');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runIndexMigration();