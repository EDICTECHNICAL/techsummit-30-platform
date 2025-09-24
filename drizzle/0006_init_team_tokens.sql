-- Idempotent migration: add team token columns with default 3 and set existing teams to 3

BEGIN;

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='tokens_marketing') THEN
        ALTER TABLE teams ADD COLUMN tokens_marketing integer NOT NULL DEFAULT 3;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='tokens_capital') THEN
        ALTER TABLE teams ADD COLUMN tokens_capital integer NOT NULL DEFAULT 3;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='tokens_team') THEN
        ALTER TABLE teams ADD COLUMN tokens_team integer NOT NULL DEFAULT 3;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='tokens_strategy') THEN
        ALTER TABLE teams ADD COLUMN tokens_strategy integer NOT NULL DEFAULT 3;
    END IF;
END$$;

-- Ensure existing rows have at least 3 tokens in each category (only update if NULL or less than 3)
UPDATE teams
SET tokens_marketing = GREATEST(COALESCE(tokens_marketing, 0), 3),
    tokens_capital = GREATEST(COALESCE(tokens_capital, 0), 3),
    tokens_team = GREATEST(COALESCE(tokens_team, 0), 3),
    tokens_strategy = GREATEST(COALESCE(tokens_strategy, 0), 3)
WHERE (COALESCE(tokens_marketing, 0) < 3)
   OR (COALESCE(tokens_capital, 0) < 3)
   OR (COALESCE(tokens_team, 0) < 3)
   OR (COALESCE(tokens_strategy, 0) < 3);

COMMIT;
