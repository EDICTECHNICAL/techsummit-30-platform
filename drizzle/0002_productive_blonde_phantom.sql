CREATE TABLE "round3_judge_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"judge_name" text NOT NULL,
	"team_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round3_peer_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_team_id" integer NOT NULL,
	"to_team_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "judge_scores" ADD COLUMN "round" text DEFAULT 'FINAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "round3_judge_ratings" ADD CONSTRAINT "round3_judge_ratings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round3_peer_ratings" ADD CONSTRAINT "round3_peer_ratings_from_team_id_teams_id_fk" FOREIGN KEY ("from_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round3_peer_ratings" ADD CONSTRAINT "round3_peer_ratings_to_team_id_teams_id_fk" FOREIGN KEY ("to_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;