const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function resetTokens() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Use permissive SSL like other scripts to avoid cert issues in dev
  const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

  try {
    console.log('Resetting team tokens to 3 where needed...');
    const res = await sql`
      UPDATE teams
      SET tokens_marketing = 3,
          tokens_capital = 3,
          tokens_team = 3,
          tokens_strategy = 3,
          updated_at = NOW()
      WHERE tokens_marketing IS DISTINCT FROM 3
         OR tokens_capital IS DISTINCT FROM 3
         OR tokens_team IS DISTINCT FROM 3
         OR tokens_strategy IS DISTINCT FROM 3
      RETURNING id, tokens_marketing, tokens_capital, tokens_team, tokens_strategy
    `;

    console.log(`Updated ${res.length} teams.`);
    if (res.length > 0) {
      res.slice(0, 20).forEach(r => console.log(' -', r.id, r.tokens_marketing, r.tokens_capital, r.tokens_team, r.tokens_strategy));
      if (res.length > 20) console.log(`...and ${res.length - 20} more`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Failed to reset team tokens:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

resetTokens();
