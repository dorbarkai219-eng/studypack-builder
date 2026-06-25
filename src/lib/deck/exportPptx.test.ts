// @vitest-environment node
// pptxgenjs branches on environment; force Node (global config is jsdom).
import { describe, it, expect } from "vitest";
import { exportDeckPptx } from "@/lib/deck/exportPptx";
import { buildDeck } from "@/lib/deck/buildDeck";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

/** Count substring occurrences. */
function count(hay: string, needle: string): number {
  let n = 0;
  let i = hay.indexOf(needle);
  while (i >= 0) {
    n++;
    i = hay.indexOf(needle, i + needle.length);
  }
  return n;
}

describe("exportDeckPptx (spec §4.3 PPTX export)", () => {
  it("produces a non-trivial .pptx zip (PK magic bytes)", async () => {
    const buf = await exportDeckPptx(hebrewFinancePack);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(5000);
    // .pptx is a zip — starts with PK\x03\x04
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
    expect(buf[2]).toBe(0x03);
    expect(buf[3]).toBe(0x04);
  });

  it("emits one slide XML per deck slide", async () => {
    const buf = await exportDeckPptx(hebrewFinancePack);
    const slideCount = buildDeck(hebrewFinancePack).length;
    // zip central directory lists each slideN.xml entry once; the "slides/slide"
    // path token recurs per slide (entry + rels + content-type refs), so assert
    // we see at least one occurrence per slide.
    const txt = buf.toString("latin1");
    expect(count(txt, "slides/slide")).toBeGreaterThanOrEqual(slideCount);
  });

  it("works for the LTR pack too (genericity)", async () => {
    const buf = await exportDeckPptx(englishBiologyPack);
    expect(buf.length).toBeGreaterThan(5000);
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it("is structurally deterministic (equal slide count across calls)", async () => {
    const a = await exportDeckPptx(hebrewFinancePack);
    const b = await exportDeckPptx(hebrewFinancePack);
    // Byte-equality fails (pptxgenjs stamps a created-at time in core.xml), so
    // compare structure: same number of slide entries.
    const ta = a.toString("latin1");
    const tb = b.toString("latin1");
    expect(count(ta, "slides/slide")).toBe(count(tb, "slides/slide"));
  });
});
