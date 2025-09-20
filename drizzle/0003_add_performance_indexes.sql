-- Performance optimization indexes for techsummit-30-platform
-- Created: September 20, 2025
-- Purpose: Optimize database queries for high concurrency during voting and rating

-- Index for votes table - optimize team-based queries
CREATE INDEX IF NOT EXISTS idx_votes_team_id ON votes(team_id);

-- Index for votes table - optimize time-based queries
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- Index for votes table - composite index for team votes by time
CREATE INDEX IF NOT EXISTS idx_votes_team_time ON votes(team_id, created_at);

-- Index for teams table - optimize active team queries
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active) WHERE is_active = true;

-- Index for user table - optimize team member lookups
CREATE INDEX IF NOT EXISTS idx_user_team_id ON "user"(team_id);

-- Index for judge_scores table - optimize judge scoring queries
CREATE INDEX IF NOT EXISTS idx_judge_scores_team_id ON judge_scores(team_id);
CREATE INDEX IF NOT EXISTS idx_judge_scores_created_at ON judge_scores(created_at);

-- Index for quiz_submissions table - optimize team quiz lookups
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_team_id ON quiz_submissions(team_id);

-- Index for final_ratings table - optimize final round queries
CREATE INDEX IF NOT EXISTS idx_final_ratings_team_id ON final_ratings(team_id);
CREATE INDEX IF NOT EXISTS idx_final_ratings_created_at ON final_ratings(created_at);

-- Index for sessions table - optimize session cleanup and lookups
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON session(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON session(user_id);

-- Analyze tables for query optimization
ANALYZE votes;
ANALYZE teams;
ANALYZE "user";
ANALYZE judge_scores;
ANALYZE quiz_submissions;
ANALYZE final_ratings;
ANALYZE session;