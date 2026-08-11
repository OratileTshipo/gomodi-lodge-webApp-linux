import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
  decimal,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------- Enums ----------
export const roleEnum = pgEnum("role", ["owner", "assistant", "staff"]);
export const bookingCategoryEnum = pgEnum("booking_category", [
  "leisure",
  "corporate",
  "event",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "approved",
  "declined",
  "cancelled",
]);
export const addOnTypeEnum = pgEnum("addon_type", ["breakfast", "dinner"]);
export const clockActionEnum = pgEnum("clock_action", ["clock_in", "clock_out"]);
export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "accepted",
  "declined",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "declined",
]);

// ---------- Users (Owner / Assistant / Staff) ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull().unique(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Rooms ----------
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  config: varchar("config", { length: 120 }).notNull(),
  bathOrShower: varchar("bath_or_shower", { length: 20 }).notNull(),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  amenities: text("amenities").notNull(),
  description: text("description").notNull().default(""),
  // Public image paths (from /public) for this room's gallery — order matters,
  // the first entry is the card thumbnail. Empty array = use placeholder art.
  images: jsonb("images")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
});

// ---------- Seasonal Pricing ----------
// Date-ranged rate overrides for festive/busy periods (e.g. the December
// festive season, Easter weekends). When a night falls inside an ACTIVE period
// the seasonal per-night rate applies instead of the room's base rate; outside
// those windows the base rate is used. This gives the owner the "set a higher
// price for the busy weekend, then it resets automatically" behaviour.
export const seasonalPricing = pgTable("seasonal_pricing", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  ratePerNight: decimal("rate_per_night", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
});

// ---------- Booking Requests ----------
export const bookingRequests = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  category: bookingCategoryEnum("category").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  guestName: varchar("guest_name", { length: 150 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 30 }).notNull(),
  contactEmail: varchar("contact_email", { length: 150 }),
  specialRequests: text("special_requests"), // <--- ADDED HERE
  sourceChannel: varchar("source_channel", { length: 30 })
    .notNull()
    .default("website"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

// ---------- Booking Room Lines ----------
export const bookingRoomLines = pgTable("booking_room_lines", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id")
    .notNull()
    .references(() => bookingRequests.id, { onDelete: "cascade" }),
  roomId: integer("room_id")
    .notNull()
    .references(() => rooms.id),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  guestCount: integer("guest_count").notNull().default(2),
});

// ---------- Add-on selections ----------
export const addOnSelections = pgTable("add_on_selections", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id")
    .notNull()
    .references(() => bookingRequests.id, { onDelete: "cascade" }),
  type: addOnTypeEnum("type").notNull(),
  persons: integer("persons").notNull(),
  date: date("date").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// ---------- Corporate Details ----------
export const corporateDetails = pgTable("corporate_details", {
  bookingRequestId: integer("booking_request_id")
    .primaryKey()
    .references(() => bookingRequests.id, { onDelete: "cascade" }),
  jobTitle: varchar("job_title", { length: 150 }),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  billingEmail: varchar("billing_email", { length: 150 }),
  poNumber: varchar("po_number", { length: 100 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  clientRef: varchar("client_ref", { length: 100 }),
  notes: text("notes"),
});

// ---------- Event Details ----------
export const eventDetails = pgTable("event_details", {
  bookingRequestId: integer("booking_request_id")
    .primaryKey()
    .references(() => bookingRequests.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 60 }).notNull(),
  expectedGuests: integer("expected_guests").notNull(),
  eventDate: date("event_date").notNull(),
  altDate: date("alt_date"),
  cateringPackage: varchar("catering_package", { length: 60 }),
  interestedInRooms: boolean("interested_in_rooms").notNull().default(false),
  notes: text("notes"),
});

// ---------- Staff Time Clocks ----------
export const staffTimeClocks = pgTable("staff_time_clocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: clockActionEnum("action").notNull(),
  // withTimezone -> timestamptz, so the clock-in/out time is an absolute
  // instant and displays correctly regardless of server/DB/browser timezone
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
});

// ---------- Auth OTPs (login codes) ----------
// Stores the SHA-256 hash of a 6-digit login code (never the plaintext), its
// expiry, and a failed-attempt counter so verify can lock out brute force.
export const authOtps = pgTable("auth_otps", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 30 }).notNull(),
  codeHash: varchar("code_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumed: boolean("consumed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Quotations & Invoices ----------
// One quote per booking request. Auto-created (draft) when a request comes in,
// edited by the owner in the admin quote editor, then marked "sent" when the
// PDF + public link are delivered to the requester. Line items carry the
// per-night / per-guest pricing so the owner can adjust fees before sending.
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id")
    .notNull()
    .references(() => bookingRequests.id, { onDelete: "cascade" })
    .unique(),
  quoteNumber: varchar("quote_number", { length: 30 }).notNull().unique(),
  status: quoteStatusEnum("status").notNull().default("draft"),
  // Publicly shareable access token — the requester's link uses this, so the
  // quote can be viewed/downloaded without any login.
  publicToken: varchar("public_token", { length: 64 }).notNull().unique(),
  validUntil: date("valid_until"),
  // VAT rate in percent (0 disables VAT). Corporate clients reclaim VAT, so
  // the quote shows subtotal + VAT + total. 15% is the SA standard.
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("15.00"),
  // Free-text notes shown to the requester on the quote/invoice (e.g. deposit
  // terms, payment details, cancellation policy).
  notes: text("notes"),
  // Server-computed totals — never trust client-side math. Decimals stored as
  // strings; cents math happens in lib/quotes.ts.
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0.00"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quoteLineItems = pgTable("quote_line_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 255 }).notNull(),
  // Quantity is a decimal so part-days / per-guest units work (e.g. 2.5 nights).
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unit: varchar("unit", { length: 30 }).notNull().default("night"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------- Guest Reviews ----------
// Public guest reviews, written via the token-gated /review flow (see
// review_invites below). Every review must trace to a real stay:
// - bookingRequestId links the review to the actual booking (kept when the
//   booking is deleted, hence "set null")
// - the public review form is only reachable with the unguessable invite
//   token, so strangers can't post
// Reviews start `pending`; staff approve/decline before anything public.
// Guardrail: never seed or fabricate reviews — only real guests via invites.
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id").references(
    () => bookingRequests.id,
    { onDelete: "set null" }
  ),
  // Display name — empty means the guest chose to stay anonymous ("Guest").
  guestName: varchar("guest_name", { length: 150 }).notNull().default(""),
  category: bookingCategoryEnum("category"),
  rating: integer("rating").notNull(), // 1–5
  headline: varchar("headline", { length: 120 }).notNull(),
  body: text("body").notNull(),
  // Felt-word tags the guest picks ("slept well", "felt at home", "great breakfast"…)
  feelings: jsonb("feelings").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Vercel Blob URLs (via /api/upload) — displayed on the review card.
  photos: jsonb("photos").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  status: reviewStatusEnum("status").notNull().default("pending"),
  // POPIA: explicit consent to publish name + words. False → shown as "Guest".
  consentToPublish: boolean("consent_to_publish").notNull().default(true),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

// One unguessable invite per booking request (unique), created after checkout
// and delivered by WhatsApp. The /review?token=… page validates it, so only
// a real guest who stayed can leave a review — and only once.
export const reviewInvites = pgTable("review_invites", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id")
    .notNull()
    .unique()
    .references(() => bookingRequests.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  // "sent" → invited, not yet reviewed; "submitted" → review already written
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

// ---------- Proof of Payments ----------
export const proofOfPayments = pgTable("proof_of_payments", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id")
    .notNull()
    .references(() => bookingRequests.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});
