import { describe, it, expect } from "vitest";
import { verifyPack } from "@/lib/verify/verifyPack";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";
import type { CoursePack } from "@/lib/coursepack/schema";

describe("verifyPack (spec §7 anti-hallucination)", () => {
  it("mock packs produce zero structural ERRORs", () => {
    expect(verifyPack(hebrewFinancePack).counts.error).toBe(0);
    expect(verifyPack(englishBiologyPack).counts.error).toBe(0);
  });

  it("reports coverage as fractions in [0,1]", () => {
    const r = verifyPack(hebrewFinancePack);
    for (const v of Object.values(r.coverage)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("every block in the mock pack appears in the deck", () => {
    const r = verifyPack(hebrewFinancePack);
    expect(r.coverage.blocksWithDeck).toBe(1);
  });

  it("flags an unknown source id in a sourceRef", () => {
    const broken: CoursePack = {
      ...hebrewFinancePack,
      blocks: hebrewFinancePack.blocks.map((b, i) =>
        i === 0
          ? { ...b, examples: [{ text: "x", sourceRef: "src999 page 1" }] }
          : b,
      ),
    };
    const r = verifyPack(broken);
    expect(r.findings.some((f) => f.code === "unknown_source_id")).toBe(true);
    expect(r.counts.error).toBeGreaterThan(0);
  });

  it("flags a block with no concepts AND no formulas", () => {
    const broken: CoursePack = {
      ...hebrewFinancePack,
      blocks: hebrewFinancePack.blocks.map((b, i) =>
        i === 0 ? { ...b, concepts: [], formulas: [] } : b,
      ),
    };
    const r = verifyPack(broken);
    expect(r.findings.some((f) => f.code === "block_empty")).toBe(true);
  });

  it("warns when an RTL pack carries a Hebrew-laden formula (spec §6)", () => {
    const broken: CoursePack = {
      ...hebrewFinancePack,
      blocks: hebrewFinancePack.blocks.map((b, i) =>
        i === 0
          ? {
              ...b,
              formulas: [
                {
                  latexOrText: "מחיר = כמות × עלות",
                  intuition: "x",
                  termKey: [{ symbol: "x", meaning: "y" }],
                },
              ],
            }
          : b,
      ),
    };
    const r = verifyPack(broken);
    expect(r.findings.some((f) => f.code === "formula_has_hebrew")).toBe(true);
  });

  it("counts findings by severity", () => {
    const r = verifyPack(hebrewFinancePack);
    const sum =
      r.findings.filter((f) => f.severity === "error").length +
      r.findings.filter((f) => f.severity === "warn").length +
      r.findings.filter((f) => f.severity === "info").length;
    expect(sum).toBe(r.findings.length);
    expect(r.counts.error + r.counts.warn + r.counts.info).toBe(r.findings.length);
  });

  it("flags concept without sourceRef as warn (spec §7)", () => {
    const r = verifyPack(hebrewFinancePack);
    expect(r.findings.some((f) => f.code === "concept_no_provenance")).toBe(true);
  });

  it("flags formula without sourceRef as warn (spec §7)", () => {
    const r = verifyPack(hebrewFinancePack);
    expect(r.findings.some((f) => f.code === "formula_no_provenance")).toBe(true);
  });

  it("flags unknown source id on a formula sourceRef", () => {
    const broken: CoursePack = {
      ...hebrewFinancePack,
      blocks: hebrewFinancePack.blocks.map((b, i) =>
        i === 0
          ? {
              ...b,
              formulas: b.formulas.map((f, fi) =>
                fi === 0 ? { ...f, sourceRef: "src999 p. 4" } : f,
              ),
            }
          : b,
      ),
    };
    const r = verifyPack(broken);
    expect(r.findings.some((f) => f.code === "unknown_source_id")).toBe(true);
  });

  it("counts conceptSourceRef + formulaSourceRef coverage", () => {
    const r = verifyPack(hebrewFinancePack);
    expect(typeof r.coverage.conceptSourceRef).toBe("number");
    expect(typeof r.coverage.formulaSourceRef).toBe("number");
    expect(r.coverage.conceptSourceRef).toBeGreaterThanOrEqual(0);
    expect(r.coverage.formulaSourceRef).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic", () => {
    const a = verifyPack(hebrewFinancePack);
    const b = verifyPack(hebrewFinancePack);
    expect(a).toEqual(b);
  });
});
