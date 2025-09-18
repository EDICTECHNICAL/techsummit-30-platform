const postgres = require('postgres');
require('dotenv').config();

async function resetDatabase() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('Connected to database');

    // Drop all tables in the correct order (respecting foreign key constraints)
    const dropQueries = [
      'DROP TABLE IF EXISTS judge_scores CASCADE',
      'DROP TABLE IF EXISTS peer_ratings CASCADE',
      'DROP TABLE IF EXISTS final_pitches CASCADE',
      'DROP TABLE IF EXISTS token_conversions CASCADE',
      'DROP TABLE IF EXISTS votes CASCADE',
      'DROP TABLE IF EXISTS pitches CASCADE',
      'DROP TABLE IF EXISTS quiz_submissions CASCADE',
      'DROP TABLE IF EXISTS options CASCADE',
      'DROP TABLE IF EXISTS questions CASCADE',
      'DROP TABLE IF EXISTS rounds CASCADE',
      'DROP TABLE IF EXISTS verification CASCADE',
      'DROP TABLE IF EXISTS account CASCADE',
      'DROP TABLE IF EXISTS session CASCADE',
      'DROP TABLE IF EXISTS "user" CASCADE',
      'DROP TABLE IF EXISTS teams CASCADE',
      'DROP TABLE IF EXISTS admins CASCADE',
    ];

    console.log('Dropping existing tables...');
    for (const query of dropQueries) {
      try {
        await sql.unsafe(query);
        console.log(`✓ ${query}`);
      } catch (error) {
        console.log(`- ${query} (table didn't exist)`);
      }
    }

    console.log('\n✅ All tables dropped successfully!');
    console.log('Now run: npx drizzle-kit push');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await sql.end();
  }
}

resetDatabase();