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
  pgEnum,
} from "drizzle-orm/pg-core";

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
