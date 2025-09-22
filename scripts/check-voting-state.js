const postgres = require('postgres');

(async function(){
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not set');
      process.exit(1);
    }
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    const rows = await sql`SELECT id, current_team_id, current_team_name, pitch_cycle_active, current_phase, updated_at FROM voting_state LIMIT 1`;
    console.log('voting_state row:', JSON.stringify(rows, null, 2));
    await sql.end({ timeout: 5 });
    process.exit(0);
  } catch (err) {
    console.error('Error querying voting_state:', err);
    process.exit(1);
  }
})();
