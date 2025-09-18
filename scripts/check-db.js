const postgres = require('postgres');
require('dotenv').config();

async function checkDb() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    console.log('Checking users and teams...');
    const users = await sql`
      SELECT u.id, u.username, u.name, u.team_id, t.name as team_name 
      FROM "user" u 
      LEFT JOIN teams t ON u.team_id = t.id
    `;
    console.log('Users:', users);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkDb();