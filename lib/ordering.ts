// Ordering-window rules. Times are evaluated in India time (Asia/Kolkata),
// so the cut-off is the same whether checked in the browser or on the server
// (which runs in UTC on Vercel). Shared by the form (client) and /api/submit.

export const ORDER_TIMING_NOTE =
  "Order timing is from 6:00 AM to 8:00 AM";

const CUTOFF_MINUTES = 8 * 60; // 8:00 AM

function istNow(now: Date): { date: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some runtimes report midnight as 24
  const minutes = hour * 60 + parseInt(get("minute"), 10);
  return { date, minutes };
}

// Returns an error message if an order for `entryDate` is not allowed right
// now, otherwise null. YYYY-MM-DD strings compare correctly as dates.
export function checkOrderTiming(
  entryDate: string,
  now: Date = new Date()
): string | null {
  if (!entryDate) return null; // empty-date handled by the usual validation
  const { date: today, minutes } = istNow(now);

  if (entryDate < today) {
    return "You can't order for a past date. Please choose today (before 8:00 AM) or a future date.";
  }
  if (entryDate === today && minutes >= CUTOFF_MINUTES) {
    return "Ordering for today has closed — the cut-off is 8:00 AM. You can still place an order for tomorrow or a later date.";
  }
  return null;
}
