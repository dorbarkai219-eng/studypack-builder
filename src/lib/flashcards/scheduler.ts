/**
 * Spaced-repetition scheduler — a small, deterministic SM-2 variant.
 *
 * Pure functions only (no Date.now() inside the math) so the whole thing
 * is unit-testable and the UI stays the single place that knows "now".
 *
 * Ratings map to the classic four buttons:
 *   again — lapse; card returns to the front of the learning queue
 *   hard  — small interval growth, ease drops
 *   good  — normal growth (interval × ease)
 *   easy  — aggressive growth, ease rises
 */

export type Rating = "again" | "hard" | "good" | "easy";

export interface CardState {
  /** Successful reviews in a row (resets on "again"). */
  reps: number;
  /** SM-2 ease factor; clamped to [1.3, 3.0]. */
  ease: number;
  /** Current interval in days (0 = still learning today). */
  interval: number;
  /** ISO date (YYYY-MM-DD) when the card is next due. */
  due: string;
  /** Times the card lapsed ("again" after having been learned). */
  lapses: number;
}

export type CardStateMap = Record<string, CardState>;

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const MAX_INTERVAL_DAYS = 365;

/** Format a Date as a local ISO day (YYYY-MM-DD). */
export function toISODay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(now: Date, days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return toISODay(d);
}

function clampEase(e: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, e));
}

/** A card with no state yet, due immediately. */
export function initialState(now: Date): CardState {
  return { reps: 0, ease: 2.5, interval: 0, due: toISODay(now), lapses: 0 };
}

/**
 * Apply a rating to a card's state and return the next state.
 * `prev` may be undefined for a brand-new card.
 */
export function rate(
  prev: CardState | undefined,
  rating: Rating,
  now: Date,
): CardState {
  const s = prev ?? initialState(now);

  switch (rating) {
    case "again":
      return {
        reps: 0,
        ease: clampEase(s.ease - 0.2),
        interval: 0,
        due: toISODay(now), // stays in today's queue
        lapses: s.reps > 0 ? s.lapses + 1 : s.lapses,
      };
    case "hard": {
      const interval = Math.min(
        MAX_INTERVAL_DAYS,
        Math.max(1, Math.round(s.interval * 1.2)),
      );
      return {
        reps: s.reps + 1,
        ease: clampEase(s.ease - 0.15),
        interval,
        due: addDays(now, interval),
        lapses: s.lapses,
      };
    }
    case "good": {
      const interval = Math.min(
        MAX_INTERVAL_DAYS,
        s.reps === 0 ? 1 : Math.max(2, Math.round(s.interval * s.ease)),
      );
      return {
        reps: s.reps + 1,
        ease: s.ease,
        interval,
        due: addDays(now, interval),
        lapses: s.lapses,
      };
    }
    case "easy": {
      const base = s.reps === 0 ? 2 : Math.max(3, s.interval * s.ease * 1.3);
      const interval = Math.min(MAX_INTERVAL_DAYS, Math.round(base));
      return {
        reps: s.reps + 1,
        ease: clampEase(s.ease + 0.15),
        interval,
        due: addDays(now, interval),
        lapses: s.lapses,
      };
    }
  }
}

/** Is the card due on (or before) the given day? New cards are always due. */
export function isDue(state: CardState | undefined, now: Date): boolean {
  if (!state) return true;
  return state.due <= toISODay(now);
}

/** Count due cards among a state map (ignores cards never seen). */
export function countDue(states: CardStateMap, now: Date): number {
  const today = toISODay(now);
  let n = 0;
  for (const s of Object.values(states)) if (s.due <= today) n++;
  return n;
}
