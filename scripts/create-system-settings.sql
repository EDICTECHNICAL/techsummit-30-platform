-- Manual SQL to create system settings table
-- Run this in your database console or via SQL tool

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default registration deadline setting
INSERT INTO system_settings (key, value, description) 
VALUES ('registration_deadline', '', 'Team registration deadline (ISO date string). Empty means open registration.')
ON CONFLICT (key) DO NOTHING;