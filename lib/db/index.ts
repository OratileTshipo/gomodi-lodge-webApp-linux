import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Hardened pool: bounded connections, sane timeouts and an idle-client error
// handler so a transient Neon blip (seen as "AggregateError: [6 errors]" on
// cold starts) never hangs a page or crashes the server. The remote round-trip
// is further mitigated by 60s room-list caching in lib/rooms-cache.ts.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 240_000,
  connectionTimeoutMillis: 15_000,
  keepAlive: true,
  // Abort any single query that hangs past 10s — a stuck remote-Neon query
  // should fail fast for the guest instead of spinning until the platform
  // kills the request.
  statement_timeout: 10_000,
});

// Unhandled 'error' events on an idle pooled client would otherwise crash the
// Node process. Log instead; a replacement connection is acquired on demand.
pool.on("error", (err) => {
  console.error("[db] idle pool client error:", err.message);
});

export const db = drizzle(pool, { schema });
