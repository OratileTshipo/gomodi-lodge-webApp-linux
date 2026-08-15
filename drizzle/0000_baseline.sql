CREATE TYPE "public"."addon_type" AS ENUM('breakfast', 'lunch', 'dinner');--> statement-breakpoint
CREATE TYPE "public"."booking_category" AS ENUM('leisure', 'corporate', 'event');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'approved', 'declined', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."clock_action" AS ENUM('clock_in', 'clock_out');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'declined');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'assistant', 'staff', 'partner');--> statement-breakpoint
CREATE TABLE "add_on_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_request_id" integer NOT NULL,
	"type" "addon_type" NOT NULL,
	"persons" integer NOT NULL,
	"date" date NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(30) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "booking_category" NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"guest_name" varchar(150) NOT NULL,
	"contact_phone" varchar(30) NOT NULL,
	"contact_email" varchar(150),
	"special_requests" text,
	"source_channel" varchar(30) DEFAULT 'website' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"notified_partner_at" timestamp,
	"contacted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "booking_room_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_request_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"guest_count" integer DEFAULT 2 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_details" (
	"booking_request_id" integer PRIMARY KEY NOT NULL,
	"job_title" varchar(150),
	"company_name" varchar(200) NOT NULL,
	"billing_email" varchar(150),
	"po_number" varchar(100),
	"vat_number" varchar(50),
	"client_ref" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "event_details" (
	"booking_request_id" integer PRIMARY KEY NOT NULL,
	"event_type" varchar(60) NOT NULL,
	"expected_guests" integer NOT NULL,
	"event_date" date NOT NULL,
	"alt_date" date,
	"catering_package" varchar(60),
	"interested_in_rooms" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "proof_of_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_request_id" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" varchar(30) DEFAULT 'night' NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_request_id" integer NOT NULL,
	"quote_number" varchar(30) NOT NULL,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"public_token" varchar(64) NOT NULL,
	"valid_until" date,
	"vat_rate" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"notes" text,
	"subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"vat_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_booking_request_id_unique" UNIQUE("booking_request_id"),
	CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number"),
	CONSTRAINT "quotes_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "review_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_request_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	CONSTRAINT "review_invites_booking_request_id_unique" UNIQUE("booking_request_id"),
	CONSTRAINT "review_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_request_id" integer,
	"guest_name" varchar(150) DEFAULT '' NOT NULL,
	"category" "booking_category",
	"rating" integer NOT NULL,
	"headline" varchar(120) NOT NULL,
	"body" text NOT NULL,
	"feelings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"consent_to_publish" boolean DEFAULT true NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by_id" integer,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"config" varchar(120) NOT NULL,
	"bath_or_shower" varchar(20) NOT NULL,
	"base_rate" numeric(10, 2) NOT NULL,
	"amenities" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasonal_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(120) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"rate_per_night" numeric(10, 2) NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_time_clocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" "clock_action" NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "add_on_selections" ADD CONSTRAINT "add_on_selections_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_room_lines" ADD CONSTRAINT "booking_room_lines_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_room_lines" ADD CONSTRAINT "booking_room_lines_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_details" ADD CONSTRAINT "corporate_details_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_details" ADD CONSTRAINT "event_details_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_of_payments" ADD CONSTRAINT "proof_of_payments_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_invites" ADD CONSTRAINT "review_invites_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_time_clocks" ADD CONSTRAINT "staff_time_clocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;