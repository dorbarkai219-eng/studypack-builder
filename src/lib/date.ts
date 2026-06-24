/** Whole days from today (UTC) until an ISO `YYYY-MM-DD` exam date. */
export function daysUntil(examDate: string, today: Date = new Date()): number {
  const [y, m, d] = examDate.split("-").map(Number);
  const exam = Date.UTC(y, m - 1, d);
  const start = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return Math.round((exam - start) / 86_400_000);
}
