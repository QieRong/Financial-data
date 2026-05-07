CREATE TYPE "public"."sync_status" AS ENUM('SUCCESS', 'FAILED', 'PROCESSING');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_data" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"report_type_id" bigserial NOT NULL,
	"stock_code" varchar(10) NOT NULL,
	"latest_date" date NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_types" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" varchar(255),
	CONSTRAINT "report_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigserial NOT NULL,
	"type_id" bigserial NOT NULL,
	"title" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorites" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigserial NOT NULL,
	"item_id" bigserial NOT NULL,
	"position" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nav_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"pid" bigserial DEFAULT NULL NOT NULL,
	"path" varchar(255) NOT NULL,
	"sort" integer NOT NULL,
	"icon" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"report_type_id" bigserial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recently_opened" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigserial NOT NULL,
	"item_id" bigserial NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"syncTaskId" bigserial NOT NULL,
	"sync_status" "sync_status" NOT NULL,
	"error_message" text,
	"sync_time" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_tasks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"stock_code" varchar(10) NOT NULL,
	"report_type" varchar(20) NOT NULL,
	"sync_status" "sync_status" DEFAULT 'SUCCESS' NOT NULL,
	"last_sync_time" timestamp with time zone DEFAULT now() NOT NULL,
	"priority_score" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "priority_score_check" CHECK ("sync_tasks"."priority_score" >= 0 AND "sync_tasks"."priority_score" <= 100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "access_permissions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigserial NOT NULL,
	"item_id" bigserial NOT NULL,
	"can_read" boolean DEFAULT true,
	"can_write" boolean DEFAULT false,
	"can_share" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"avatar_url" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_data" ADD CONSTRAINT "financial_data_report_type_id_report_types_id_fk" FOREIGN KEY ("report_type_id") REFERENCES "public"."report_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_type_id_report_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."report_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_item_id_nav_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."nav_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nav_items" ADD CONSTRAINT "nav_items_pid_nav_items_id_fk" FOREIGN KEY ("pid") REFERENCES "public"."nav_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nav_items" ADD CONSTRAINT "nav_items_report_type_id_report_types_id_fk" FOREIGN KEY ("report_type_id") REFERENCES "public"."report_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recently_opened" ADD CONSTRAINT "recently_opened_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recently_opened" ADD CONSTRAINT "recently_opened_item_id_nav_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."nav_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_syncTaskId_sync_tasks_id_fk" FOREIGN KEY ("syncTaskId") REFERENCES "public"."sync_tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_permissions" ADD CONSTRAINT "access_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_permissions" ADD CONSTRAINT "access_permissions_item_id_nav_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."nav_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "financial_data_composite_idx" ON "financial_data" USING btree ("report_type_id","stock_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_data_reportType_idx" ON "financial_data" USING btree ("report_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_data_date_idx" ON "financial_data" USING btree ("latest_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reports_user_title_idx" ON "reports" USING btree ("user_id","title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_type_idx" ON "reports" USING btree ("type_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_composite_idx" ON "favorites" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_position_idx" ON "favorites" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorites_user_added_at_idx" ON "favorites" USING btree ("user_id","added_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nav_items_path_idx" ON "nav_items" USING btree ("path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nav_items_sort_idx" ON "nav_items" USING btree ("sort");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "recently_opened_composite_idx" ON "recently_opened" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recently_opened_user_opened_at_idx" ON "recently_opened" USING btree ("user_id","opened_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_history_task_id_idx" ON "sync_history" USING btree ("syncTaskId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_history_sync_time_idx" ON "sync_history" USING btree ("sync_time");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sync_task_composite_idx" ON "sync_tasks" USING btree ("stock_code","report_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_task_priority_idx" ON "sync_tasks" USING btree ("priority_score");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "access_permissions_composite_idx" ON "access_permissions" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_idx" ON "users" USING btree ("email");