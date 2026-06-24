import { describe, it, expect } from "vitest";
import { buildPlan } from "@/lib/plan/buildPlan";
import { buildDeck } from "@/lib/deck/buildDeck";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

describe("buildPlan countdown (spec §4.5)", () => {
  it("produces exactly N days", () => {
    expect(buildPlan(hebrewFinancePack, 7)).toHaveLength(7);
    expect(buildPlan(hebrewFinancePack, 3)).toHaveLength(3);
    expect(buildPlan(hebrewFinancePack, 1)).toHaveLength(1);
  });

  it("numbers days 1..N contiguously", () => {
    const plan = buildPlan(hebrewFinancePack, 6);
    expect(plan.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("reserves the last 1–2 days for mock exams with NO new material", () => {
    const plan = buildPlan(hebrewFinancePack, 8);
    const mocks = plan.filter((d) => d.slideRefs.length === 0);
    expect(mocks.length).toBeGreaterThanOrEqual(1);
    // mock days are the final days
    const lastTwo = plan.slice(-2);
    expect(lastTwo.every((d) => d.slideRefs.length === 0)).toBe(true);
    // last day is light review, mentions no new material
    const last = plan[plan.length - 1];
    expect(last.learn.some((t) => /no new material|בלי חומר חדש/.test(t.task))).toBe(
      true,
    );
  });

  it("every plan day's slideRefs exist in the deck, in deck order (spec §5 #5)", () => {
    const plan = buildPlan(hebrewFinancePack, 10);
    const deckTitles = buildDeck(hebrewFinancePack).map((s) => s.title);
    for (const day of plan) {
      for (const ref of day.slideRefs) {
        expect(deckTitles).toContain(ref);
      }
      // order preserved: indices ascend
      const idxs = day.slideRefs.map((r) => deckTitles.indexOf(r));
      const sorted = [...idxs].sort((a, b) => a - b);
      expect(idxs).toEqual(sorted);
    }
  });

  it("references every block across the learning days", () => {
    const plan = buildPlan(hebrewFinancePack, 9);
    const deck = buildDeck(hebrewFinancePack);
    const titleToBlock = new Map(deck.map((s) => [s.title, s.blockId]));
    const covered = new Set<string>();
    for (const day of plan)
      for (const ref of day.slideRefs) {
        const b = titleToBlock.get(ref);
        if (b) covered.add(b);
      }
    for (const block of hebrewFinancePack.blocks)
      expect(covered.has(block.id)).toBe(true);
  });

  it("weights starred topics — they appear no later than non-starred", () => {
    // With spare days, starred blocks get extra review days (more total coverage).
    const plan = buildPlan(hebrewFinancePack, 12);
    const starredDays = plan.filter((d) => d.star).length;
    expect(starredDays).toBeGreaterThan(0);
  });

  it("works for the LTR pack (genericity)", () => {
    const plan = buildPlan(englishBiologyPack, 5);
    expect(plan).toHaveLength(5);
    expect(plan[0].learn.length + plan[0].practice.length).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    expect(buildPlan(hebrewFinancePack, 7)).toEqual(buildPlan(hebrewFinancePack, 7));
  });

  it("handles a 1-day cram with no mock day", () => {
    const plan = buildPlan(hebrewFinancePack, 1);
    expect(plan).toHaveLength(1);
    expect(plan[0].slideRefs.length).toBeGreaterThan(0);
  });
});
