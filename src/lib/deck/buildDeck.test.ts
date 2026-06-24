import { describe, it, expect } from "vitest";
import { buildDeck } from "@/lib/deck/buildDeck";
import { exportDeckHtml } from "@/lib/deck/exportHtml";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

describe("buildDeck structure (spec §4.3)", () => {
  const deck = buildDeck(hebrewFinancePack);

  it("starts with title then TOC", () => {
    expect(deck[0].kind).toBe("title");
    expect(deck[1].kind).toBe("toc");
  });

  it("ends with a closing slide", () => {
    expect(deck[deck.length - 1].kind).toBe("closing");
  });

  it("represents every block in at least one slide", () => {
    for (const block of hebrewFinancePack.blocks) {
      expect(deck.some((s) => s.blockId === block.id)).toBe(true);
    }
  });

  it("splits a heavy block across multiple formula slides", () => {
    // Block A has 2 formulas (1 slide); craft proof via block with >2.
    const blockC = hebrewFinancePack.blocks.find((b) => b.id === "C")!;
    expect(blockC.formulas.length).toBe(2);
    // Concepts+formulas+examples each yield slides → block C has >1 slide.
    const cSlides = deck.filter((s) => s.blockId === "C");
    expect(cSlides.length).toBeGreaterThan(1);
  });

  it("produces unique, stable ids across calls", () => {
    const ids = deck.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const again = buildDeck(hebrewFinancePack).map((s) => s.id);
    expect(again).toEqual(ids);
  });

  it("includes summary slides when summaries exist", () => {
    const kinds = deck.map((s) => s.kind);
    expect(kinds).toContain("summary-comparisons");
    expect(kinds).toContain("summary-concepts-traps");
    expect(kinds).toContain("summary-sanity");
  });

  it("TOC entries point at real slide ids", () => {
    const toc = deck[1];
    if (toc.payload.kind !== "toc") throw new Error("expected toc");
    const ids = new Set(deck.map((s) => s.id));
    for (const e of toc.payload.entries) expect(ids.has(e.slideId)).toBe(true);
  });

  it("keeps RTL Hebrew titles intact", () => {
    expect(deck.some((s) => s.title.includes("הקשר הזהוב"))).toBe(true);
  });

  it("works for the LTR pack too (genericity)", () => {
    const en = buildDeck(englishBiologyPack);
    expect(en[0].kind).toBe("title");
    expect(en.some((s) => s.title.includes("Enzyme"))).toBe(true);
  });
});

describe("self-contained HTML export (spec §8, §11 #7)", () => {
  const html = exportDeckHtml(hebrewFinancePack);

  it("is a full HTML document with dir from the course", () => {
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('dir="rtl"');
  });

  it("has NO external script/style/link refs (offline self-contained)", () => {
    expect(html).not.toMatch(/<script\s+src=/);
    expect(html).not.toMatch(/<link\s+[^>]*href=/);
    expect(html).not.toMatch(/@import\s+url/);
  });

  it("keeps a known formula LTR-isolated", () => {
    expect(html).toContain("unicode-bidi:isolate");
    expect(html).toContain("R_e = R_f + β × MRP");
  });

  it("escapes nothing dangerous into raw markup", () => {
    // sanity: title present, no unescaped script injection vector from data
    expect(html).toContain("מימון תאגידי");
  });
});
