const postgres = require('postgres');
require('dotenv').config();

async function fixTestUser() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    console.log('Fixing test user team assignment...');
    const result = await sql`
      UPDATE "user" 
      SET team_id = 1 
      WHERE username = 'test'
    `;
    console.log('✓ Updated test user to be in team 1');
    
    // Check the result
    const users = await sql`
      SELECT u.id, u.username, u.name, u.team_id, t.name as team_name 
      FROM "user" u 
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.username = 'test'
    `;
    console.log('Test user now:', users);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

fixTestUser();