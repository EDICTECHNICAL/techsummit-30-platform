const postgres = require('postgres');

const SQL = `
CREATE TABLE IF NOT EXISTS voting_state (
  id SERIAL PRIMARY KEY,
  current_team_id integer NULL,
  current_team_name text NULL,
  pitch_cycle_active boolean NOT NULL DEFAULT false,
  voting_active boolean NOT NULL DEFAULT false,
  all_pitches_completed boolean NOT NULL DEFAULT false,
  current_phase text NOT NULL DEFAULT 'idle',
  cycle_start_ts timestamp without time zone NULL,
  phase_start_ts timestamp without time zone NULL,
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM voting_state WHERE id = 1) THEN
    INSERT INTO voting_state (id, updated_at) VALUES (1, now());
  END IF;
END$$;
`;

(async function(){
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not set');
      process.exit(1);
    }
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    console.log('Applying voting_state SQL...');
    await sql.begin(async sqlTx => {
      await sqlTx.unsafe(SQL);
    });
    console.log('Applied voting_state successfully');
    await sql.end({ timeout: 5 });
    process.exit(0);
  } catch (err) {
    console.error('Error applying voting_state SQL:', err);
    process.exit(1);
  }
})();
