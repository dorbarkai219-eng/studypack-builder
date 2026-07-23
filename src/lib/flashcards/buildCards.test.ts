import { describe, expect, it } from "vitest";
import { buildCards } from "./buildCards";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

describe("buildCards", () => {
  it("derives cards from concepts, formulas and confusing pairs", () => {
    const cards = buildCards(hebrewFinancePack);
    const concepts = hebrewFinancePack.blocks.reduce(
      (n, b) => n + b.concepts.length,
      0,
    );
    const formulas = hebrewFinancePack.blocks.reduce(
      (n, b) => n + b.formulas.length,
      0,
    );
    const pairs = hebrewFinancePack.summaries.confusingPairs.length;
    expect(cards.length).toBe(concepts + formulas + pairs);
  });

  it("produces stable, unique ids", () => {
    const a = buildCards(hebrewFinancePack).map((c) => c.id);
    const b = buildCards(hebrewFinancePack).map((c) => c.id);
    expect(a).toEqual(b); // deterministic
    expect(new Set(a).size).toBe(a.length); // unique
  });

  it("marks formula cards as LTR-backed with a term key", () => {
    for (const card of buildCards(englishBiologyPack)) {
      if (card.kind === "formula") {
        expect(card.ltrBack).toBe(true);
        expect(Array.isArray(card.termKey)).toBe(true);
      } else {
        expect(card.ltrBack).toBeUndefined();
      }
    }
  });

  it("every card has non-empty front and back", () => {
    for (const card of buildCards(hebrewFinancePack)) {
      expect(card.front.length).toBeGreaterThan(0);
      expect(card.back.length).toBeGreaterThan(0);
    }
  });
});
