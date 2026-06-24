import type { Summaries } from "@/lib/coursepack/schema";
import type { LabelFn } from "@/lib/i18n/labels";
import { Ltr } from "./Ltr";

/** Side-by-side "confusing pairs" — the distinctions that lose points (§3.5). */
export function ComparisonSection({
  pairs,
  t,
}: {
  pairs: Summaries["confusingPairs"];
  t: LabelFn;
}) {
  if (pairs.length === 0) return null;
  return (
    <section className="cs-box">
      <h2 className="m-0 mb-1 border-b border-lines pb-1 text-[1.12em] font-bold text-navy">
        {t("comparisons")}
      </h2>
      {pairs.map((p, i) => (
        <div key={i} className="mb-1.5 last:mb-0">
          <p className="m-0 text-[0.95em] font-semibold text-ink">{p.title}</p>
          <div className="grid grid-cols-2 gap-1">
            <div className="rounded border border-lines bg-keyidea-bg/40 p-1">
              <Ltr className="block font-mono text-[0.95em]">{p.left}</Ltr>
              <p className="m-0 mt-0.5 text-[0.85em] text-muted">
                <span className="font-semibold">{t("useLeft")}:</span> {p.whenLeft}
              </p>
            </div>
            <div className="rounded border border-lines bg-example-bg/40 p-1">
              <Ltr className="block font-mono text-[0.95em]">{p.right}</Ltr>
              <p className="m-0 mt-0.5 text-[0.85em] text-muted">
                <span className="font-semibold">{t("useRight")}:</span> {p.whenRight}
              </p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

/** Critical concepts + traps pair (§3.6, §4.4). */
export function ConceptsTrapsSection({
  concepts,
  traps,
  t,
}: {
  concepts: string[];
  traps: string[];
  t: LabelFn;
}) {
  if (concepts.length === 0 && traps.length === 0) return null;
  return (
    <section className="cs-box">
      {concepts.length > 0 && (
        <>
          <h2 className="m-0 mb-1 text-[1.05em] font-bold text-keyidea">
            {t("criticalConcepts")}
          </h2>
          <ul className="m-0 mb-1.5 ps-4 text-[0.95em]">
            {concepts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      )}
      {traps.length > 0 && (
        <>
          <h2 className="m-0 mb-1 text-[1.05em] font-bold text-mistake">{t("traps")}</h2>
          <ul className="m-0 ps-4 text-[0.95em]">
            {traps.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Typical-values / sanity-check table (§3.6). */
export function SanityTable({
  values,
  t,
}: {
  values: Summaries["typicalValues"];
  t: LabelFn;
}) {
  if (values.length === 0) return null;
  return (
    <section className="cs-box">
      <h2 className="m-0 mb-1 border-b border-lines pb-1 text-[1.05em] font-bold text-navy">
        {t("typicalValues")}
      </h2>
      <table className="w-full border-collapse text-[0.9em]">
        <thead>
          <tr className="text-start text-muted">
            <th className="border-b border-lines py-0.5 text-start font-semibold">
              {t("param")}
            </th>
            <th className="border-b border-lines py-0.5 text-start font-semibold">
              {t("range")}
            </th>
          </tr>
        </thead>
        <tbody>
          {values.map((v, i) => (
            <tr key={i} className="align-top">
              <td className="border-b border-lines/60 py-0.5 pe-2">{v.param}</td>
              <td className="border-b border-lines/60 py-0.5">
                <Ltr as="span" className="font-mono">
                  {v.range}
                </Ltr>
                {v.note && <span className="block text-[0.85em] text-muted">{v.note}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** 30-second pre-submission checklist (§3.6). */
export function ChecklistSection({ items, t }: { items: string[]; t: LabelFn }) {
  if (items.length === 0) return null;
  return (
    <section className="cs-box">
      <h2 className="m-0 mb-1 border-b border-lines pb-1 text-[1.05em] font-bold text-tip">
        {t("checklist")}
      </h2>
      <ul className="m-0 list-none p-0 text-[0.95em]">
        {items.map((c, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span
              aria-hidden
              className="mt-[0.15em] inline-block h-[0.85em] w-[0.85em] flex-none rounded-sm border border-tip"
            />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
