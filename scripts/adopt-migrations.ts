/**
 * One-time adoption helper for databases previously managed with
 * `drizzle-kit push` (which leaves no migration history).
 *
 * It marks the baseline migration (the first journal entry, which reproduces
 * the full current schema) as applied WITHOUT re-running it — those tables
 * already exist. After this runs once, the repo's canonical `db:migrate` path
 * takes over: every future schema change ships as a versioned migration and
 * is applied idempotently.
 *
 * Usage:
 *   DATABASE_URL=... npm run db:adopt     # mark baseline as applied
 *   DATABASE_URL=... npm run db:migrate   # applies everything after baseline
 *
 * Fresh databases (CI, new preview branches) skip this entirely — migrate
 * just works from 0000_baseline.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const journalPath = "drizzle/meta/_journal.json";
const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
  entries: { idx: number; tag: string; when: number }[];
};

const baseline = journal.entries[0];
if (!baseline) {
  console.error("No migrations found in the journal — nothing to adopt.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    // Same DDL shape drizzle-orm's migrator uses (pg-core/dialect.js):
    // schema `drizzle`, table `__drizzle_migrations`, hash = sha256 of the
    // raw migration SQL file, created_at = journal millis. The migrator only
    // applies entries newer than the last recorded created_at.
    await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await client.query(
      `CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )`
    );

    const sqlText = readFileSync(`drizzle/${baseline.tag}.sql`, "utf8");
    const hash = createHash("sha256").update(sqlText).digest("hex");

    const { rowCount } = await client.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
       SELECT $1::text, $2::bigint
       WHERE NOT EXISTS (
         SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at = $2::bigint
       )`,
      [hash, baseline.when]
    );

    if (rowCount === 1) {
      console.log(
        `Marked baseline migration "${baseline.tag}" as applied. ` +
          `Now run: npm run db:migrate`
      );
    } else {
      console.log(
        `Baseline "${baseline.tag}" already recorded — nothing to do. ` +
          `Run: npm run db:migrate`
      );
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Adoption failed:", err);
  process.exit(1);
});
