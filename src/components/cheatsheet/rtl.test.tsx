import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Ltr } from "./Ltr";
import { FormulaBox } from "./FormulaBox";
import { TopicBox } from "./TopicBox";
import { makeLabels } from "@/lib/i18n/labels";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";

/**
 * Spec §11 #3 — in an RTL course, formulas/Latin/Greek must render LTR and
 * uncorrupted; mixed titles must read correctly. We assert the bidi-isolation
 * contract (dir + unicode-bidi:isolate) AND that the text content is preserved
 * in source order (jsdom keeps textContent, so reversal/mangling would show).
 */
describe("Ltr isolation wrapper", () => {
  it("renders a <bdi> with dir=ltr and unicode-bidi:isolate", () => {
    render(<Ltr>{"Equity = EV + Excess − Debt"}</Ltr>);
    const el = screen.getByText("Equity = EV + Excess − Debt");
    expect(el.tagName.toLowerCase()).toBe("bdi");
    expect(el).toHaveAttribute("dir", "ltr");
    expect(el).toHaveClass("ltr"); // .ltr => unicode-bidi: isolate (globals.css)
  });
});

describe("formula strings survive intact (no reversal/mangling)", () => {
  const cases = [
    "Equity = EV + Excess − Debt",
    "R_e = R_f + β × MRP",
    "WACC = (E/V) × R_e + (D/V) × R_d × (1 − T)",
  ];
  for (const s of cases) {
    it(`keeps "${s}" in source order inside an isolated LTR run`, () => {
      const { container } = render(
        <FormulaBox formula={{ latexOrText: s, intuition: "", termKey: [] }} />,
      );
      const ltr = container.querySelector("bdi.ltr");
      expect(ltr).not.toBeNull();
      expect(ltr).toHaveAttribute("dir", "ltr");
      expect(ltr!.textContent).toBe(s);
    });
  }
});

describe("mixed Hebrew+Latin block title (spec §6)", () => {
  it('renders "ROIC + הקשר הזהוב" with the Latin enTitle LTR-isolated', () => {
    const block = hebrewFinancePack.blocks.find((b) => b.id === "B")!;
    expect(block.title).toBe("ROIC + הקשר הזהוב");
    const { container } = render(<TopicBox block={block} t={makeLabels("he")} />);
    // The Latin enTitle must sit inside an isolated LTR run (bdi or span.ltr).
    const isolated = Array.from(container.querySelectorAll(".ltr"));
    const enRun = isolated.find((n) => n.textContent?.includes(block.enTitle!));
    expect(enRun).toBeDefined();
    expect(enRun).toHaveAttribute("dir", "ltr");
    // The Hebrew title text is present and unmangled.
    expect(container.textContent).toContain("הקשר הזהוב");
  });
});
