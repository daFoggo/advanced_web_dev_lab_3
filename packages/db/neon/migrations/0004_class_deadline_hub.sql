-- Class Deadline Hub: new tables, and drop the base-project mock tables (orgs, projects).
DROP TABLE IF EXISTS "projects" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "orgs" CASCADE;--> statement-breakpoint
CREATE TABLE "completions" (
	"user_id" text NOT NULL,
	"deadline_id" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "completions_user_id_deadline_id_pk" PRIMARY KEY("user_id","deadline_id")
);
--> statement-breakpoint
CREATE TABLE "deadlines" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deadlines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"subject_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subjects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"lecturer" text NOT NULL,
	"color" text NOT NULL,
	CONSTRAINT "subjects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_deadline_id_deadlines_id_fk" FOREIGN KEY ("deadline_id") REFERENCES "public"."deadlines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deadlines_due_at_idx" ON "deadlines" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "deadlines_subject_id_idx" ON "deadlines" USING btree ("subject_id");
