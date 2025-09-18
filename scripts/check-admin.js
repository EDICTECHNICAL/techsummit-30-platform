const postgres = require('postgres');
require('dotenv').config();

async function getAdminCredentials() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    console.log('🔍 Checking admin credentials...');
    const admins = await sql`SELECT id, username FROM admins`;
    console.log('Admin accounts found:', admins);
    
    if (admins.length > 0) {
      console.log('\n📋 Admin Login Credentials:');
      admins.forEach(admin => {
        console.log(`Username: ${admin.username}`);
        console.log(`Password: admin (as set in seed script)`);
        console.log(`---`);
      });
    } else {
      console.log('❌ No admin accounts found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

getAdminCredentials();