-- Idempotent creation of rating_state single-row table
CREATE TABLE IF NOT EXISTS rating_state (
  id SERIAL PRIMARY KEY,
  current_team_id INTEGER NULL,
  current_team_name TEXT NULL,
  rating_cycle_active BOOLEAN NOT NULL DEFAULT false,
  rating_active BOOLEAN NOT NULL DEFAULT false,
  all_pitches_completed BOOLEAN NOT NULL DEFAULT false,
  current_phase TEXT NULL,
  cycle_start_ts TIMESTAMPTZ NULL,
  phase_start_ts TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure there is exactly one canonical row (insert if empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rating_state) THEN
    INSERT INTO rating_state (current_phase, updated_at) VALUES ('idle', now());
  END IF;
END$$;
