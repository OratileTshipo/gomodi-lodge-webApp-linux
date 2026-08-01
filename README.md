# Gomodi Guide Lodge — Website

This is the first feature slice: the Rooms page and the Leisure booking
request form, built per the project's Phase 1–3 documents.

## What's included

- `/` — homepage with the main "Book Now" entry point
- `/rooms` — all 9 rooms, with loading/empty/error states
- `/book` — the Leisure booking request form (dates, guests, breakfast/dinner
  add-ons, contact details)
- A Postgres database schema (via Drizzle ORM) covering Users, Rooms, Booking
  Requests, Booking Room Lines, and Add-on Selections
- A working anti-double-booking check: once a booking is **approved**, the
  system blocks any new request for overlapping dates on that room. (The
  Admin Approval Screen itself — where you approve/decline — is the next
  feature slice, not built yet.)
- A stubbed WhatsApp notification function (`lib/notifications.ts`) that logs
  to the console instead of sending — it needs real Meta Business API
  credentials before it can send real messages. See the Changelog for this
  open item.

## One architecture note

The Phase 2 Architecture Document specified **Prisma** as the ORM. During
this build, Prisma's engine download was unreachable from the build sandbox,
so this slice uses **Drizzle ORM** instead — a lightweight, TypeScript-native
alternative that needs no downloaded binary engine, which is arguably a
better fit for serverless hosting anyway. This is logged as a Phase 3
Changelog decision.

## Running it yourself (optional — for your own testing before deploying)

You don't need to do this if you just want to deploy straight to Vercel (see
below) — but if you want to run it on your own computer first:

1. Install Node.js (v20 or later) and PostgreSQL.
2. `npm install`
3. Create a `.env` file with your own database connection:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gomodi_dev"
   ```
4. `npx drizzle-kit push` (creates the tables)
5. `npx tsx lib/db/seed.ts` (seeds the 9 rooms)
6. `npm run dev` — then open http://localhost:3000

## Deploying to Vercel (recommended path — no local setup needed)

1. **Create a free GitHub account** at github.com, if you haven't already
   decided which account to use (this is the open item flagged in the Phase 3
   Changelog).
2. Create a new, **private** GitHub repository.
3. Push this code to it (I can walk you through this step by step, or do it
   for you if you connect GitHub here).
4. Sign up for a **free Vercel account** at vercel.com using your GitHub
   login.
5. In Vercel, click "New Project" and import the GitHub repository.
6. Add a `DATABASE_URL` environment variable in Vercel's project settings,
   pointing to a real Postgres database. Two easy, low-cost managed options
   that work well with Vercel: **Neon** or **Supabase** (both have free
   tiers suitable for a 9-room property).
7. Vercel will build and deploy automatically. Once deployed, run the same
   `drizzle-kit push` and seed steps against your production database (I can
   guide you through this) so the 9 rooms exist there too.
8. You'll get a live URL you can open on your phone — that's your Dev link
   for the phone-test step in our Definition of Done.

## What's next

Per the Backlog Tracker, the next feature slices are the Corporate Quote
Request Form and the Admin Approval Screen (needed before any request can
actually be confirmed).
