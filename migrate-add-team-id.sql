-- Add team_id column to user table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user' 
        AND column_name = 'team_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "user" ADD COLUMN "team_id" integer;
        ALTER TABLE "user" ADD CONSTRAINT "user_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL;
    END IF;
END $$;