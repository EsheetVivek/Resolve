ALTER TABLE "tickets" ADD COLUMN "customer_hash" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "classified_by" text DEFAULT 'rules' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "classify_model" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "injection_flags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "tickets_workspace_id_customer_hash_created_at_index" ON "tickets" USING btree ("workspace_id","customer_hash","created_at");