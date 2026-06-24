import type { Block } from "@/lib/coursepack/schema";
import type { LabelFn } from "@/lib/i18n/labels";
import { Ltr } from "./Ltr";
import { FormulaBox } from "./FormulaBox";
import { Callout } from "./Callout";

function Stars({ level }: { level: number }) {
  if (level <= 0) return null;
  return (
    <span className="text-orange" aria-label={`priority ${level}`}>
      {"★".repeat(level)}
    </span>
  );
}

/**
 * TopicBox — one Block as a self-contained cheat-sheet box (spec §3.2, §3.3):
 * starred title (local + EN), framing, concepts WITH explanations, formula
 * boxes, then example / mistake / tip callouts. Latin titles are LTR-isolated.
 */
export function TopicBox({ block, t }: { block: Block; t: LabelFn }) {
  return (
    <section className="cs-box">
      <header className="mb-1 border-b border-lines pb-1">
        <h2 className="m-0 flex flex-wrap items-baseline gap-1.5 text-[1.18em] font-bold text-navy">
          <Stars level={block.starLevel} />
          <span>
            {block.title}
            {block.enTitle && (
              <>
                {" "}
                <Ltr as="span" className="text-[0.82em] font-medium text-muted">
                  ({block.enTitle})
                </Ltr>
              </>
            )}
          </span>
          {block.examMapping && (
            <span className="ms-auto rounded bg-navy/10 px-1.5 py-0.5 text-[0.72em] font-semibold text-navy">
              {block.examMapping}
            </span>
          )}
        </h2>
        {block.framing && (
          <p className="m-0 mt-0.5 text-[0.95em] italic text-muted">{block.framing}</p>
        )}
      </header>

      {block.concepts.map((c, i) => (
        <p key={i} className="m-0 mb-1 text-[0.97em]">
          <span className="font-semibold text-ink">{c.term}</span>
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

      {block.formulas.map((f, i) => (
        <FormulaBox key={i} formula={f} />
      ))}

      {block.examples.map((ex, i) => (
        <Callout key={`ex${i}`} kind="example" label={t("example")}>
          {ex.text}
          {ex.sourceRef && (
            <Ltr as="span" className="ms-1 text-[0.82em] text-muted">
              [{ex.sourceRef}]
            </Ltr>
          )}
        </Callout>
      ))}

      {block.mistakes.map((m, i) => (
        <Callout key={`m${i}`} kind="mistake" label={t("mistake")}>
          {m}
        </Callout>
      ))}

      {block.tips.map((tip, i) => (
        <Callout key={`t${i}`} kind="tip" label={t("tip")}>
          {tip}
        </Callout>
      ))}
    </section>
  );
}
