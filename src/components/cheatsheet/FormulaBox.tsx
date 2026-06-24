import type { Formula } from "@/lib/coursepack/schema";
import { Ltr } from "./Ltr";
import { TermKeyStrip } from "./TermKeyStrip";

/**
 * FormulaBox — dark, monospaced formula with an intuition caption and an
 * optional per-box term key (spec §3.3, §3.4, §5).
 * The formula itself is ALWAYS LTR-isolated; the caption follows page dir.
 */
export function FormulaBox({ formula }: { formula: Formula }) {
  return (
    <div className="formula-box my-1 overflow-hidden rounded-md border-s-4 border-orange bg-formula-bg">
      <div className="px-2 py-1.5">
        <Ltr className="block font-mono text-[1.05em] leading-snug text-formula-ink">
          {formula.latexOrText}
        </Ltr>
      </div>
      {(formula.intuition || formula.termKey.length > 0) && (
        <div className="bg-paper px-2 py-1">
          {formula.intuition && (
            <p className="m-0 text-[0.95em] text-muted">{formula.intuition}</p>
          )}
          <TermKeyStrip entries={formula.termKey} />
        </div>
      )}
    </div>
  );
}
