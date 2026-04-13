CREATE TYPE "public"."room_type" AS ENUM('bomb', 'pop', 'scribble', 'vote');--> statement-breakpoint
CREATE TABLE "room" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "room_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"max_players" integer DEFAULT 10 NOT NULL,
	"player_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"password_hash" text,
	"is_private" boolean DEFAULT false,
	"type" "room_type" DEFAULT 'bomb' NOT NULL,
	"owner_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "hat_id" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "shirt_id" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "character" ALTER COLUMN "eyes_id" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;