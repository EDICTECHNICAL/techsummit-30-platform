const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Judge accounts with secure passwords
const judgeAccounts = [
  {
    id: 'judge_001',
    username: 'judge1',
    name: 'Judge User 1',
    password: 'TechSummit2025!Judge1',
  },
  {
    id: 'judge_002',
    username: 'judge2', 
    name: 'Judge User 2',
    password: 'TechSummit2025!Judge2',
  },
  {
    id: 'judge_003',
    username: 'judge3',
    name: 'Judge User 3',
    password: 'TechSummit2025!Judge3',
  },
  {
    id: 'judge_004',
    username: 'judge4',
    name: 'Judge User 4',
    password: 'TechSummit2025!Judge4',
  },
  {
    id: 'judge_005',
    username: 'judge5',
    name: 'Judge User 5', 
    password: 'TechSummit2025!Judge5',
  }
];

async function createJudgeAccount(sql, account) {
  try {
    // Check if judge account already exists
    const existing = await sql`
      SELECT username FROM "judges" WHERE username = ${account.username}
    `;
    
    if (existing.length > 0) {
      console.log(`✓ Judge account ${account.username} already exists`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(account.password, 12);

    // Create the judge account in judges table
    await sql`
      INSERT INTO "judges" (id, username, name, password, created_at, updated_at) 
      VALUES (
        ${account.id},
        ${account.username},
        ${account.name},
        ${hashedPassword},
        NOW(),
        NOW()
      )
    `;

    console.log(`✓ Created judge account: ${account.username}`);
  } catch (error) {
    console.error(`✗ Failed to create judge account ${account.username}:`, error.message);
  }
}

async function seedJudgeAccounts() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🚀 Starting judge account seeding...\n');

    // First, let's check if the judges table exists
    try {
      await sql`SELECT 1 FROM "judges" LIMIT 1`;
      console.log('✓ Judges table exists');
    } catch (error) {
      console.log('⚠️  Judges table might not exist, creating it...');
      
      // Create judges table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS "judges" (
          id VARCHAR(36) PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      console.log('✓ Judges table created');
    }

    console.log('\nCreating judge accounts...');
    for (const judge of judgeAccounts) {
      await createJudgeAccount(sql, judge);
    }

    console.log('\n✅ Judge account seeding completed!\n');

    // Display credentials
    console.log('='.repeat(60));
    console.log('JUDGE ACCOUNTS CREATED/VERIFIED:');
    console.log('='.repeat(60));
    judgeAccounts.forEach((judge, index) => {
      console.log(`Judge ${index + 1}:`);
      console.log(`  Username: ${judge.username}`);
      console.log(`  Password: ${judge.password}`);
      console.log(`  Name: ${judge.name}`);
      console.log('');
    });

    console.log('🎯 You can now login to the judge panel at: /judge/login');
    console.log('');

  } catch (error) {
    console.error('❌ Failed to seed judge accounts:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the seeding
seedJudgeAccounts();