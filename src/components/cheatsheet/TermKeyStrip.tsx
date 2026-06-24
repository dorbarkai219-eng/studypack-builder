import type { TermKeyEntry } from "@/lib/coursepack/schema";
import { Ltr } from "./Ltr";

/**
 * TermKeyStrip — compact symbol→meaning key for ONE box (spec §3.4).
 * The reader should never leave the box to understand its formulas.
 * Symbols are LTR-isolated; meanings follow the page direction.
 */
export function TermKeyStrip({ entries }: { entries: TermKeyEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <dl className="m-0 flex flex-wrap gap-x-2.5 gap-y-0.5 border-t border-lines pt-1 text-[0.92em] text-muted">
      {entries.map((e, i) => (
        <span key={i} className="inline-flex items-baseline gap-1">
          <dt className="m-0">
            <Ltr as="span" className="font-mono font-semibold text-ink">
              {e.symbol}
            </Ltr>
          </dt>
          <dd className="m-0">{e.meaning}</dd>
        </span>
      ))}
    </dl>
  );
}
