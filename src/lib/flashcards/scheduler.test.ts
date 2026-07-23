import { describe, expect, it } from "vitest";
import {
  countDue,
  initialState,
  isDue,
  rate,
  toISODay,
  type CardState,
} from "./scheduler";

const NOW = new Date(2026, 6, 2); // 2026-07-02 local

describe("toISODay", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toISODay(NOW)).toBe("2026-07-02");
    expect(toISODay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("rate", () => {
  it("new card + good → due tomorrow", () => {
    const s = rate(undefined, "good", NOW);
    expect(s.reps).toBe(1);
    expect(s.interval).toBe(1);
    expect(s.due).toBe("2026-07-03");
  });

  it("new card + again → stays due today with lower ease", () => {
    const s = rate(undefined, "again", NOW);
    expect(s.reps).toBe(0);
    expect(s.interval).toBe(0);
    expect(s.due).toBe("2026-07-02");
    expect(s.ease).toBeCloseTo(2.3);
    expect(s.lapses).toBe(0); // never learned → not a lapse
  });

  it("learned card + again → counts a lapse and resets reps", () => {
    const learned: CardState = {
      reps: 3,
      ease: 2.5,
      interval: 10,
      due: "2026-07-02",
      lapses: 0,
    };
    const s = rate(learned, "again", NOW);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.interval).toBe(0);
  });

  it("good grows the interval by the ease factor", () => {
    let s = rate(undefined, "good", NOW); // interval 1
    s = rate(s, "good", NOW); // 1 * 2.5 → max(2, 3) = 3
    expect(s.interval).toBe(3);
    s = rate(s, "good", NOW); // 3 * 2.5 → 8
    expect(s.interval).toBe(8);
  });

  it("easy grows faster and raises ease", () => {
    const s = rate(undefined, "easy", NOW);
    expect(s.interval).toBe(2);
    expect(s.ease).toBeCloseTo(2.65);
  });

  it("hard grows slowly and lowers ease (floor 1.3)", () => {
    let s: CardState = {
      reps: 1,
      ease: 1.35,
      interval: 5,
      due: "2026-07-02",
      lapses: 0,
    };
    s = rate(s, "hard", NOW);
    expect(s.interval).toBe(6); // 5 * 1.2
    expect(s.ease).toBe(1.3); // clamped
  });

  it("interval never exceeds 365 days", () => {
    const s: CardState = {
      reps: 9,
      ease: 3,
      interval: 300,
      due: "2026-07-02",
      lapses: 0,
    };
    expect(rate(s, "easy", NOW).interval).toBe(365);
  });
});

describe("isDue / countDue", () => {
  it("new (stateless) cards are due", () => {
    expect(isDue(undefined, NOW)).toBe(true);
  });

  it("cards due today or earlier are due; future are not", () => {
    expect(isDue(initialState(NOW), NOW)).toBe(true);
    const future = rate(undefined, "good", NOW); // due tomorrow
    expect(isDue(future, NOW)).toBe(false);
  });

  it("countDue counts only seen cards at/before today", () => {
    const states = {
      a: initialState(NOW), // due today
      b: rate(undefined, "good", NOW), // due tomorrow
      c: { reps: 1, ease: 2.5, interval: 1, due: "2026-06-30", lapses: 0 },
    };
    expect(countDue(states, NOW)).toBe(2);
  });
});
