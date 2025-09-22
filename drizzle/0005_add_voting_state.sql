-- Migration 0005: Add voting_state table (single-row canonical state for serverless timer)

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

-- Ensure there is a canonical first row with id=1
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM voting_state WHERE id = 1) THEN
    INSERT INTO voting_state (id, updated_at) VALUES (1, now());
  END IF;
END$$;
