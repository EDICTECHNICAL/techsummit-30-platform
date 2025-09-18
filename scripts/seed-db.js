const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('Connected to database for seeding...');

    // Insert sample teams
    console.log('Creating sample teams...');
    const teams = await sql`
      INSERT INTO teams (name, college) VALUES 
      ('Tech Innovators', 'MIT'),
      ('Digital Dreams', 'Stanford'),
      ('Code Crusaders', 'Berkeley'),
      ('AI Pioneers', 'CMU'),
      ('Data Dynamos', 'Caltech')
      RETURNING id, name
    `;

    console.log('✓ Created teams:', teams.map(t => `${t.id}: ${t.name}`).join(', '));

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin', 10);
    const userPassword = await bcrypt.hash('password', 10);

    // Insert sample admin
    console.log('Creating admin user...');
    await sql`
      INSERT INTO admins (id, username, password) VALUES 
      ('admin-1', 'admin', ${adminPassword})
    `;
    console.log('✓ Created admin user (admin/admin)');

    // Insert sample rounds
    console.log('Creating sample rounds...');
    const rounds = await sql`
      INSERT INTO rounds (name, day, status) VALUES 
      ('QUIZ', 1, 'PENDING'),
      ('VOTING', 1, 'PENDING'),
      ('FINAL', 2, 'PENDING')
      RETURNING id, name, status
    `;

    console.log('✓ Created rounds:', rounds.map(r => `${r.id}: ${r.name} (${r.status})`).join(', '));

    // Insert sample users with team assignments
    console.log('Creating sample users...');
    const users = await sql`
      INSERT INTO "user" (id, username, name, password, team_id) VALUES 
      ('user-1', 'leader1', 'Team Leader 1', ${userPassword}, ${teams[0].id}),
      ('user-2', 'leader2', 'Team Leader 2', ${userPassword}, ${teams[1].id}),
      ('user-3', 'leader3', 'Team Leader 3', ${userPassword}, ${teams[2].id}),
      ('user-4', 'leader4', 'Team Leader 4', ${userPassword}, ${teams[3].id}),
      ('user-5', 'leader5', 'Team Leader 5', ${userPassword}, ${teams[4].id})
      RETURNING id, username, name, team_id
    `;

    console.log('✓ Created users with team assignments:');
    users.forEach(u => {
      const team = teams.find(t => t.id === u.team_id);
      console.log(`  ${u.username} (${u.name}) -> Team ${team?.name}`);
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin/admin');
    console.log('Users: leader1/password, leader2/password, etc.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await sql.end();
  }
}

seedDatabase();