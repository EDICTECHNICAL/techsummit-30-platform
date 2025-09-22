const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function apply() {
  const sqlPath = path.join(__dirname, '..', 'drizzle', '0005_add_rating_state.sql');
  const sqlText = fs.readFileSync(sqlPath, 'utf8');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required to run this script. Set it in .env.local');
    process.exit(1);
  }

  let sql;
  try {
    // Default try
    sql = postgres(process.env.DATABASE_URL, { ssl: true });
    await sql.begin(async (tx) => {
      await tx.unsafe(sqlText);
    });
    console.log('Applied rating_state SQL successfully');
  } catch (err) {
    console.warn('First attempt failed:', err.message || err);
    try {
      // Retry with permissive SSL for custom cert chains
      if (sql && sql.end) await sql.end();
      sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
      await sql.begin(async (tx) => {
        await tx.unsafe(sqlText);
      });
      console.log('Applied rating_state SQL successfully on retry');
    } catch (err2) {
      console.error('Failed to apply rating_state SQL on retry:', err2.message || err2);
      if (sql && sql.end) await sql.end();
      process.exit(1);
    }
  } finally {
    if (sql && sql.end) await sql.end();
  }
}

if (require.main === module) apply();
