import { db } from "../lib/db/index";
import {
  bookingRequests,
  bookingRoomLines,
  addOnSelections,
  corporateDetails,
  eventDetails,
  proofOfPayments,
  staffTimeClocks,
} from "../lib/db/schema";
import { asc, eq } from "drizzle-orm";

// Remove ALL test/duplicate request rows EXCEPT the clean demo trio created by
// scripts/_demo-flows.ts (ids 9-11: Demo Leisure Guest / Demo Corp Contact /
// Demo Event Planner). Everything else is junk from earlier testing sessions.
async function main() {
  const all = await db.select().from(bookingRequests).orderBy(asc(bookingRequests.id));
  const keepIds = new Set(
    all
      .filter((r) => r.guestName.startsWith("Demo "))
      .slice(0, 3)
      .map((r) => r.id)
  );
  const removeIds = all.filter((r) => !keepIds.has(r.id)).map((r) => r.id);
  console.log("Total requests:", all.length, "| keeping:", [...keepIds].sort((a, b) => a - b), "| removing:", removeIds);

  for (const id of removeIds) {
    await db.delete(addOnSelections).where(eq(addOnSelections.bookingRequestId, id));
    await db.delete(bookingRoomLines).where(eq(bookingRoomLines.bookingRequestId, id));
    await db.delete(corporateDetails).where(eq(corporateDetails.bookingRequestId, id));
    await db.delete(eventDetails).where(eq(eventDetails.bookingRequestId, id));
    await db.delete(proofOfPayments).where(eq(proofOfPayments.bookingRequestId, id));
    await db.delete(bookingRequests).where(eq(bookingRequests.id, id));
  }
  await db.delete(staffTimeClocks);
  console.log("Done. Remaining requests:");
  const left = await db.select().from(bookingRequests);
  console.log(left.map((r) => `${r.id} ${r.category} ${r.guestName} (${r.status})`).join("\n"));
  process.exit(0);
}

main().catch((e) => {
  console.error("CLEANUP FAILED:", e.message ?? e);
  process.exit(1);
});
