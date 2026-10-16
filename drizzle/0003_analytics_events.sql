CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"visitor_id" text NOT NULL,
	"session_id" text,
	"user_id" text,
	"reading_id" text,
	"path" text,
	"props" jsonb
);
--> statement-breakpoint
CREATE INDEX "events_at_idx" ON "events" USING brin ("at");--> statement-breakpoint
CREATE INDEX "events_name_at_idx" ON "events" USING btree ("name","at");--> statement-breakpoint
CREATE INDEX "events_reading_id_idx" ON "events" USING btree ("reading_id");--> statement-breakpoint
CREATE INDEX "events_visitor_id_idx" ON "events" USING btree ("visitor_id");