const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Admin accounts with secure passwords
const adminAccounts = [
  {
    id: 'admin_001',
    username: 'admin1',
    password: 'TechSummit2025!Admin1',
  },
  {
    id: 'admin_002', 
    username: 'admin2',
    password: 'TechSummit2025!Admin2',
  },
  {
    id: 'admin_003',
    username: 'admin3', 
    password: 'TechSummit2025!Admin3',
  },
  {
    id: 'admin_004',
    username: 'admin4',
    password: 'TechSummit2025!Admin4',
  },
  {
    id: 'admin_005',
    username: 'admin5',
    password: 'TechSummit2025!Admin5',
  }
];

async function createAdminAccount(sql, account) {
  try {
    // Check if admin account already exists
    const existing = await sql`
      SELECT username FROM "admins" WHERE username = ${account.username}
    `;
    
    if (existing.length > 0) {
      console.log(`✓ Admin account ${account.username} already exists`);
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
    console.error(`✗ Failed to create admin account ${account.username}:`, error.message);
  }
}

async function seedAdminAccounts() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🚀 Starting admin account seeding...\n');

    // First, let's check if the admins table exists
    try {
      await sql`SELECT 1 FROM "admins" LIMIT 1`;
      console.log('✓ Admins table exists');
    } catch (error) {
      console.log('⚠️  Admins table might not exist, creating it...');
      
      // Create admins table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS "admins" (
          id VARCHAR(36) PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      console.log('✓ Admins table created');
    }

    console.log('\nCreating admin accounts...');
    for (const admin of adminAccounts) {
      await createAdminAccount(sql, admin);
    }

    console.log('\n✅ Admin account seeding completed!\n');

    // Display credentials
    console.log('='.repeat(60));
    console.log('ADMIN ACCOUNTS CREATED/VERIFIED:');
    console.log('='.repeat(60));
    adminAccounts.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Password: ${admin.password}`);
      console.log('');
    });

    console.log('🎯 You can now login to the admin panel at: /admin/login');
    console.log('');

  } catch (error) {
    console.error('❌ Failed to seed admin accounts:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the seeding
seedAdminAccounts();