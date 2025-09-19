-- Add system settings table for configuration management
CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL UNIQUE,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Insert default registration deadline (set to null initially, meaning open registration)
INSERT INTO "system_settings" ("key", "value", "description") VALUES 
('registration_deadline', '', 'Team registration deadline (ISO date string). Empty means open registration.');