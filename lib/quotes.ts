/**
 * Quotation engine — storage + lifecycle for quotes.
 *
 * Lifecycle: every booking request (leisure / corporate / event) gets a draft
 * quote auto-created when the request lands (createDraftQuote). The owner
 * reviews + edits line items in the admin quote editor, then marks it sent;
 * the public /quote/[token] page + PDF let the requester view it without any
 * login. Totals are always recomputed server-side via lib/quote-math.ts
 * (integer cents) — client inputs are never trusted for money.
 *
 * Pricing sources:
 *  - Room nights: room.baseRate × nights per room line (threaded through
 *    buildDraftLines directly, so rates can never silently go missing)
 *  - Meals: addOnSelections (breakfast R175, dinner R300 per person per night)
 *  - Events: no room lines — a placeholder line the owner prices manually
 */

import { randomBytes } from "crypto";
import { db } from "./db";
import {
  quotes,
  quoteLineItems,
  bookingRequests,
  bookingRoomLines,
  rooms,
  addOnSelections,
} from "./db/schema";
import { eq, desc } from "drizzle-orm";
import { computeTotals, formatZAR, clampNonNegative } from "./quote-math";
import { nightlyRatesForStay, type SeasonalPeriod } from "./seasonal";
import { getSeasonalPeriods } from "./db/seasonal";

/**
 * Minimal query surface used by the quote engine. Both the global `db` and a
 * `db.transaction(tx)` client satisfy it, so callers can run quote creation
 * inside a booking transaction (atomic request → lines → quote).
 */
export type Queryable = Pick<typeof db, "select" | "insert" | "update" | "delete">;

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export interface QuoteLine {
  id?: number;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  sortOrder: number;
}

export interface QuoteWithLines {
  quote: typeof quotes.$inferSelect;
  lines: QuoteLine[];
  request: {
    id: number;
    category: string;
    guestName: string;
    contactPhone: string;
    contactEmail: string | null;
    status: string;
    submittedAt: Date;
  };
}

export { formatZAR };

// ---------------------------------------------------------------------------
// Quote number + token
// ---------------------------------------------------------------------------

function nextQuoteNumber(): string {
  const year = new Date().getFullYear();
  return `QT-${year}-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
}

function newPublicToken(): string {
  return randomBytes(18).toString("base64url");
}

// ---------------------------------------------------------------------------
// Auto-generation from a booking request
// ---------------------------------------------------------------------------

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

/**
 * Build draft line items for a request from its room lines and meal add-ons.
 * Pure — extracted so the pricing rules are unit-testable without a DB.
 * Room rates are passed in with each room line, never looked up by name.
 *
 * Seasonal pricing: when `periods` is provided, every night of a stay is
 * resolved individually. Nights inside an active window become their own line
 * (e.g. "Room 1 (Festive Season)") at the seasonal rate; the rest stay at the
 * base rate — so a stay straddling a festive window quotes BOTH rates exactly.
 */
export function buildDraftLines(params: {
  roomLines: { roomName: string; checkIn: string; checkOut: string; baseRate?: string }[];
  addOns: { type: string; persons: number; unitPrice: string }[];
  periods?: SeasonalPeriod[];
}): QuoteLine[] {
  const lines: QuoteLine[] = [];
  let order = 0;
  const periods = params.periods || [];

  for (const line of params.roomLines) {
    const nights = nightsBetween(line.checkIn, line.checkOut);
    if (nights <= 0) continue;
    const baseRate = clampNonNegative(line.baseRate);

    // Resolve per-night rates (seasonal-aware). If every night is the same
    // rate, emit one clean line — identical output to the pre-seasonal engine.
    const nightRates =
      periods.length > 0
        ? nightlyRatesForStay(baseRate, line.checkIn, line.checkOut, periods).map(
            (n) => n.rate
          )
        : [];
    const allSame =
      nightRates.length === 0 || nightRates.every((r) => r === nightRates[0]);

    if (allSame) {
      lines.push({
        description: line.roomName,
        quantity: String(nights),
        unit: "night",
        unitPrice: nightRates[0] ?? baseRate,
        sortOrder: order++,
      });
      continue;
    }

    // Mixed rates: group consecutive nights with the same rate into segments.
    const segments: { qty: number; rate: string; label: string }[] = [];
    for (let i = 0; i < nightRates.length; i++) {
      const rate = nightRates[i];
      const isSeasonal = rate !== baseRate;
      const label = isSeasonal ? ` (${labelForRate(periods, rate)})` : "";
      const last = segments[segments.length - 1];
      if (last && last.rate === rate && last.label === label) {
        last.qty += 1;
      } else {
        segments.push({ qty: 1, rate, label });
      }
    }
    for (const seg of segments) {
      lines.push({
        description: `${line.roomName}${seg.label}`,
        quantity: String(seg.qty),
        unit: "night",
        unitPrice: seg.rate,
        sortOrder: order++,
      });
    }
  }

  // Aggregate meal rows into one line per meal type (per person per night).
  const byType = new Map<string, { personNights: number; unitPrice: string }>();
  for (const a of params.addOns) {
    const entry = byType.get(a.type) || { personNights: 0, unitPrice: a.unitPrice };
    entry.personNights += a.persons;
    byType.set(a.type, entry);
  }
  for (const [type, entry] of byType) {
    lines.push({
      description: type === "breakfast" ? "Breakfast" : "Dinner",
      quantity: String(entry.personNights),
      unit: "person-night",
      unitPrice: clampNonNegative(entry.unitPrice),
      sortOrder: order++,
    });
  }

  return lines;
}

/** Pick a short label for a seasonal-rate night from the active window. */
function labelForRate(periods: SeasonalPeriod[], rate: string): string {
  const active = periods.filter((p) => p.active && p.ratePerNight === rate);
  if (active.length === 0) return "Seasonal rate";
  // Shortest label wins — "Easter Weekend" over "Festive Season 2026/27".
  return [...active].sort((a, b) => a.label.length - b.label.length)[0].label;
}

/**
 * Create a draft quote for a request, seeded from its room lines + meals.
 *
 * `client` defaults to the global `db`; pass a `db.transaction(tx)` client to
 * create the quote atomically with its booking request (the booking actions do
 * this so a failure can never leave a request without its draft quote).
 */
export async function createDraftQuote(
  bookingRequestId: number,
  client: Queryable = db
): Promise<number> {
  // Request category decides what pricing data exists.
  const [request] = await client
    .select({ category: bookingRequests.category })
    .from(bookingRequests)
    .where(eq(bookingRequests.id, bookingRequestId));

  const [existing] = await client
    .select({ id: quotes.id })
    .from(quotes)
    .where(eq(quotes.bookingRequestId, bookingRequestId));
  if (existing) return existing.id; // idempotent — never double-create

  let lines: QuoteLine[] = [];
  const vatRate = "15.00";

  if (request?.category !== "event") {
    // Leisure + corporate: room lines (with rates) + meal add-ons.
    const roomLines = await client
      .select({
        roomName: rooms.name,
        checkIn: bookingRoomLines.checkIn,
        checkOut: bookingRoomLines.checkOut,
        baseRate: rooms.baseRate,
      })
      .from(bookingRoomLines)
      .innerJoin(rooms, eq(bookingRoomLines.roomId, rooms.id))
      .where(eq(bookingRoomLines.bookingRequestId, bookingRequestId));

    const addOns = await client
      .select({
        type: addOnSelections.type,
        persons: addOnSelections.persons,
        unitPrice: addOnSelections.unitPrice,
      })
      .from(addOnSelections)
      .where(eq(addOnSelections.bookingRequestId, bookingRequestId));

    // Seasonal windows (e.g. festive season) adjust per-night rates; the
    // engine resolves every night so straddling stays quote exactly.
    const periods = await getSeasonalPeriods();

    lines = buildDraftLines({ roomLines, addOns, periods });
  } else {
    // Events: no room lines; seed one placeholder line the owner prices.
    lines = [
      {
        description: "Event package (price to be confirmed)",
        quantity: "1",
        unit: "event",
        unitPrice: "0.00",
        sortOrder: 0,
      },
    ];
  }

  const totals = computeTotals(lines, vatRate);

  const [quote] = await client
    .insert(quotes)
    .values({
      bookingRequestId,
      quoteNumber: nextQuoteNumber(),
      status: "draft",
      publicToken: newPublicToken(),
      validUntil: null,
      vatRate,
      notes: null,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total,
    })
    .returning();

  if (lines.length > 0) {
    await client.insert(quoteLineItems).values(
      lines.map((l) => ({
        quoteId: quote.id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        sortOrder: l.sortOrder,
      }))
    );
  }

  return quote.id;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function loadQuoteWithLines(quoteId: number): Promise<QuoteWithLines | null> {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
  if (!quote) return null;
  return assembleQuote(quote);
}

export async function loadQuoteByToken(token: string): Promise<QuoteWithLines | null> {
  const [quote] = await db.select().from(quotes).where(eq(quotes.publicToken, token));
  if (!quote) return null;
  return assembleQuote(quote);
}

export async function loadQuoteByRequestId(requestId: number): Promise<QuoteWithLines | null> {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.bookingRequestId, requestId));
  if (!quote) return null;
  return assembleQuote(quote);
}

async function assembleQuote(quote: typeof quotes.$inferSelect): Promise<QuoteWithLines> {
  const [lines, request] = await Promise.all([
    db
      .select()
      .from(quoteLineItems)
      .where(eq(quoteLineItems.quoteId, quote.id))
      .orderBy(quoteLineItems.sortOrder),
    db
      .select({
        id: bookingRequests.id,
        category: bookingRequests.category,
        guestName: bookingRequests.guestName,
        contactPhone: bookingRequests.contactPhone,
        contactEmail: bookingRequests.contactEmail,
        status: bookingRequests.status,
        submittedAt: bookingRequests.submittedAt,
      })
      .from(bookingRequests)
      .where(eq(bookingRequests.id, quote.bookingRequestId)),
  ]);

  return {
    quote,
    lines: lines.map((l) => ({
      id: l.id,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      sortOrder: l.sortOrder,
    })),
    request: request[0]!,
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface SaveQuoteInput {
  lines: QuoteLine[];
  vatRate: string;
  validUntil: string | null;
  notes: string | null;
}

function isLineObject(l: unknown): l is QuoteLine {
  return typeof l === "object" && l !== null && !Array.isArray(l);
}

/**
 * Replace a quote's line items and recompute totals server-side. Only fields
 * the owner controls are editable; totals always derive from the lines and
 * every value is sanitized (non-negative, length-capped).
 */
export async function saveQuote(quoteId: number, input: SaveQuoteInput): Promise<QuoteWithLines> {
  const cleanLines = (Array.isArray(input.lines) ? input.lines : [])
    .filter(isLineObject)
    .map((l, i) => ({
      description: String(l.description || "").trim().slice(0, 255),
      quantity: clampNonNegative(l.quantity, "0"),
      unit: String(l.unit || "night").trim().slice(0, 30) || "night",
      unitPrice: clampNonNegative(l.unitPrice, "0"),
      sortOrder: i,
    }))
    .filter((l) => l.description.length > 0);

  const rate = clampNonNegative(input.vatRate, "0");
  const totals = computeTotals(cleanLines, rate);

  await db.transaction(async (tx) => {
    await tx.delete(quoteLineItems).where(eq(quoteLineItems.quoteId, quoteId));
    if (cleanLines.length > 0) {
      await tx.insert(quoteLineItems).values(cleanLines.map((l) => ({ ...l, quoteId })));
    }
    await tx
      .update(quotes)
      .set({
        vatRate: rate,
        validUntil: input.validUntil || null,
        notes: input.notes?.trim() || null,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));
  });

  const reloaded = await loadQuoteWithLines(quoteId);
  if (!reloaded) throw new Error("Quote disappeared during save");
  return reloaded;
}

/** Mark a quote as sent (the requester has been given the link / PDF). */
export async function markQuoteSent(quoteId: number): Promise<void> {
  await db
    .update(quotes)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));
}

/** All quotes, newest first — for the admin quotes list. */
export async function listQuotes(): Promise<
  (QuoteWithLines["quote"] & { guestName: string; category: string })[]
> {
  const rows = await db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      status: quotes.status,
      publicToken: quotes.publicToken,
      validUntil: quotes.validUntil,
      vatRate: quotes.vatRate,
      notes: quotes.notes,
      subtotal: quotes.subtotal,
      vatAmount: quotes.vatAmount,
      total: quotes.total,
      sentAt: quotes.sentAt,
      createdAt: quotes.createdAt,
      updatedAt: quotes.updatedAt,
      bookingRequestId: quotes.bookingRequestId,
      guestName: bookingRequests.guestName,
      category: bookingRequests.category,
    })
    .from(quotes)
    .innerJoin(bookingRequests, eq(quotes.bookingRequestId, bookingRequests.id))
    .orderBy(desc(quotes.createdAt));
  return rows;
}
