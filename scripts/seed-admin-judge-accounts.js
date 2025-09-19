const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin accounts with secure passwords
const adminAccounts = [
  {
    id: 'admin_001',
    username: 'admin1',
    name: 'Admin User 1',
    password: 'TechSummit2025!Admin1',
    isAdmin: true
  },
  {
    id: 'admin_002', 
    username: 'admin2',
    name: 'Admin User 2',
    password: 'TechSummit2025!Admin2',
    isAdmin: true
  },
  {
    id: 'admin_003',
    username: 'admin3', 
    name: 'Admin User 3',
    password: 'TechSummit2025!Admin3',
    isAdmin: true
  },
  {
    id: 'admin_004',
    username: 'admin4',
    name: 'Admin User 4', 
    password: 'TechSummit2025!Admin4',
    isAdmin: true
  },
  {
    id: 'admin_005',
    username: 'admin5',
    name: 'Admin User 5',
    password: 'TechSummit2025!Admin5',
    isAdmin: true
  }
];

// Judge accounts with secure passwords
const judgeAccounts = [
  {
    id: 'judge_001',
    username: 'judge1',
    name: 'Judge User 1',
    password: 'TechSummit2025!Judge1',
    isAdmin: false
  },
  {
    id: 'judge_002',
    username: 'judge2', 
    name: 'Judge User 2',
    password: 'TechSummit2025!Judge2',
    isAdmin: false
  },
  {
    id: 'judge_003',
    username: 'judge3',
    name: 'Judge User 3',
    password: 'TechSummit2025!Judge3',
    isAdmin: false
  },
  {
    id: 'judge_004',
    username: 'judge4',
    name: 'Judge User 4',
    password: 'TechSummit2025!Judge4',
    isAdmin: false
  },
  {
    id: 'judge_005',
    username: 'judge5',
    name: 'Judge User 5', 
    password: 'TechSummit2025!Judge5',
    isAdmin: false
  }
];

async function createAdminAccount(sql, account) {
  try {
    // Check if admin account already exists
    const existing = await sql`
      SELECT username FROM "admins" WHERE username = ${account.username}
    `;
    
    if (existing.length > 0) {
      console.log(`Admin account ${account.username} already exists, skipping...`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(account.password, 12);

    // Create the admin account in admins table
    await sql`
      INSERT INTO "admins" (id, username, password, created_at, updated_at) 
      VALUES (
        ${account.id},
        ${account.username},
        ${hashedPassword},
        NOW(),
        NOW()
      )
    `;

    console.log(`✓ Created admin account: ${account.username}`);
  } catch (error) {
    console.error(`✗ Failed to create admin account ${account.username}:`, error);
  }
}

async function createJudgeAccount(sql, account) {
  try {
    // Check if judge account already exists
    const existing = await sql`
      SELECT username FROM "judges" WHERE username = ${account.username}
    `;
    
    if (existing.length > 0) {
      console.log(`Judge account ${account.username} already exists, skipping...`);
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
    console.error(`✗ Failed to create judge account ${account.username}:`, error);
  }
}

async function seedAccounts() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🚀 Starting account seeding...\n');

    console.log('Creating admin accounts...');
    for (const admin of adminAccounts) {
      await createAdminAccount(sql, admin);
    }

    console.log('\nCreating judge accounts...');
    for (const judge of judgeAccounts) {
      await createJudgeAccount(sql, judge);
    }

    console.log('\n✅ Account seeding completed!\n');

    // Display credentials
    console.log('='.repeat(60));
    console.log('ADMIN ACCOUNTS CREATED:');
    console.log('='.repeat(60));
    adminAccounts.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Password: ${admin.password}`);
      console.log(`  Name: ${admin.name}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('JUDGE ACCOUNTS CREATED:');
    console.log('='.repeat(60));
    judgeAccounts.forEach((judge, index) => {
      console.log(`Judge ${index + 1}:`);
      console.log(`  Username: ${judge.username}`);
      console.log(`  Password: ${judge.password}`);
      console.log(`  Name: ${judge.name}`);
      console.log('');
    });

  } catch (error) {
    console.error('Failed to seed accounts:', error);
  } finally {
    await sql.end();
  }
}

// Run the seeding
seedAccounts();