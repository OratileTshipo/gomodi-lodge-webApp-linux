import { db } from "./index";
import { seasonalPricing } from "./schema";
import { desc } from "drizzle-orm";
import type { SeasonalPeriod } from "../seasonal";

/** All seasonal periods, newest window first (active periods included). */
export async function getSeasonalPeriods(): Promise<SeasonalPeriod[]> {
  const rows = await db
    .select()
    .from(seasonalPricing)
    .orderBy(desc(seasonalPricing.startDate));
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    startDate: r.startDate,
    endDate: r.endDate,
    ratePerNight: r.ratePerNight,
    active: r.active,
  }));
}
