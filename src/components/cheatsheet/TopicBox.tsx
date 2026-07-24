import type { ReactNode } from "react";
import type { Block } from "@/lib/coursepack/schema";
import type { LabelFn } from "@/lib/i18n/labels";
import { Ltr } from "./Ltr";
import { TermKeyStrip } from "./TermKeyStrip";

function Stars({ level }: { level: number }) {
  if (level <= 0) return null;
  return (
    <span className="text-orange" aria-label={`רמת חשיבות ${level}`}>
      {"★".repeat(level)}
    </span>
  );
}

/** One labeled row: a colored label cell (right, in RTL) + content cell. */
function Row({
  label,
  tone,
  children,
}: {
  label: string;
  tone: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2 border-t border-lines px-2 py-1 odd:bg-canvas/60">
      <div className={`w-[4.6em] flex-none pt-[1px] text-[0.86em] font-bold ${tone}`}>
        {label}
      </div>
      <div className="min-w-0 flex-1 space-y-1">{children}</div>
    </div>
  );
}

/**
 * TopicBox — one Block rendered as a structured "table" card (Option ג):
 * a colored header bar (starred title + EN + exam mapping), a framing line,
 * then labeled rows — מושגים / נוסחאות / דוגמאות / טעויות / טיפים. Each row's
 * label is color-coded. Latin titles/terms and formulas stay LTR-isolated
 * via <Ltr> so the RTL bidi contract holds (spec §6).
 */
export function TopicBox({ block, t }: { block: Block; t: LabelFn }) {
  return (
    <section className="cs-topic">
      <header className="flex flex-wrap items-baseline gap-1.5 bg-navy/10 px-2 py-1.5">
        <Stars level={block.starLevel} />
        <h2 className="m-0 text-[1.1em] font-black text-navy">
          {block.title}
          {block.enTitle && (
            <>
              {" "}
              <Ltr as="span" className="text-[0.8em] font-medium text-navy/70">
                ({block.enTitle})
              </Ltr>
            </>
          )}
        </h2>
        {block.examMapping && (
          <span className="ms-auto rounded-full border border-navy/40 bg-paper px-1.5 py-0.5 text-[0.68em] font-bold text-navy">
            {block.examMapping}
          </span>
        )}
      </header>

      {block.framing && (
        <p className="m-0 border-t border-lines px-2 py-1 text-[0.9em] italic text-muted">
          {block.framing}
        </p>
      )}

      <div>
        {block.concepts.length > 0 && (
          <Row label={t("rowConcepts")} tone="text-ink">
            {block.concepts.map((c, i) => (
              <p key={i} className="m-0">
                <span className="font-bold text-ink">{c.term}</span>
                {c.enTerm && (
                  <>
                    {" "}
                    <Ltr as="span" className="text-[0.85em] text-muted">
                      ({c.enTerm})
                    </Ltr>
                  </>
                )}
                {" — "}
                <span className="text-ink/85">{c.explanation}</span>
              </p>
            ))}
          </Row>
        )}

        {block.formulas.length > 0 && (
          <Row label={t("rowFormulas")} tone="text-navy">
            {block.formulas.map((f, i) => (
              <div
                key={i}
                className="rounded-md border-s-[3px] border-navy bg-canvas/70 px-2 py-1"
              >
                <Ltr className="block font-mono text-[1.02em] font-bold text-ink">
                  {f.latexOrText}
                </Ltr>
                {f.intuition && (
                  <p className="m-0 mt-0.5 text-[0.88em] text-muted">{f.intuition}</p>
                )}
                <TermKeyStrip entries={f.termKey} />
              </div>
            ))}
          </Row>
        )}

        {block.examples.length > 0 && (
          <Row label={t("rowExamples")} tone="text-example">
            {block.examples.map((ex, i) => (
              <p key={i} className="m-0">
                {ex.text}
                {ex.sourceRef && (
                  <Ltr as="span" className="ms-1 text-[0.82em] text-muted">
                    [{ex.sourceRef}]
                  </Ltr>
                )}
              </p>
            ))}
          </Row>
        )}

        {block.mistakes.length > 0 && (
          <Row label={t("rowMistakes")} tone="text-mistake">
            <ul className="m-0 list-disc space-y-0.5 ps-4">
              {block.mistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Row>
        )}

        {block.tips.length > 0 && (
          <Row label={t("rowTips")} tone="text-tip">
            <ul className="m-0 list-disc space-y-0.5 ps-4">
              {block.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </Row>
        )}
      </div>
    </section>
  );
}
