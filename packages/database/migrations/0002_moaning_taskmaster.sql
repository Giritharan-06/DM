ALTER TABLE "email_delivery_logs" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "gstin" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_dedupe_key_unique" UNIQUE("dedupe_key");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_dedupe_key_unique" UNIQUE("dedupe_key");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_invoice_id_unique" UNIQUE("invoice_id");