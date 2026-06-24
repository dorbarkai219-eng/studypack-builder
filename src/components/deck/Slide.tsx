import type { DeckSlide } from "@/lib/deck/types";
import type { LabelFn } from "@/lib/i18n/labels";
import { Ltr } from "@/components/cheatsheet/Ltr";
import { FormulaBox } from "@/components/cheatsheet/FormulaBox";
import { Callout } from "@/components/cheatsheet/Callout";
import {
  ComparisonSection,
  ConceptsTrapsSection,
  SanityTable,
  ChecklistSection,
} from "@/components/cheatsheet/Summaries";

function Stars({ level }: { level: number }) {
  if (level <= 0) return null;
  return <span className="text-orange">{"★".repeat(level)}</span>;
}

/** Slide body, switched on payload kind. Reuses the cheat-sheet primitives. */
function SlideBody({
  slide,
  t,
  onJump,
}: {
  slide: DeckSlide;
  t: LabelFn;
  onJump?: (slideId: string) => void;
}) {
  const p = slide.payload;
  switch (p.kind) {
    case "title":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h1 className="text-[2.6em] font-extrabold text-navy">{slide.title}</h1>
          <p className="mt-3 text-[1.2em] text-muted">{p.subject}</p>
          <p className="mt-6 rounded-full bg-orange/15 px-4 py-1.5 text-[0.9em] font-semibold text-orange">
            {t("examIn")} · {p.examDate} · {p.blockCount}{" "}
            {t("criticalConcepts").includes("מושג") ? "נושאים" : "topics"}
          </p>
        </div>
      );

    case "toc":
      return (
        <ol className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
          {p.entries.map((e, i) => (
            <li key={e.blockId}>
              <button
                type="button"
                onClick={() => onJump?.(e.slideId)}
                className="flex w-full items-baseline gap-2 rounded-lg border border-lines bg-paper p-3 text-start transition-shadow hover:shadow-md"
              >
                <span className="text-[1.1em] font-bold text-muted">{i + 1}.</span>
                <Stars level={e.starLevel} />
                <span className="font-semibold text-navy">{e.title}</span>
                {e.enTitle && (
                  <Ltr as="span" className="text-[0.8em] text-muted">
                    ({e.enTitle})
                  </Ltr>
                )}
              </button>
            </li>
          ))}
        </ol>
      );

    case "concept":
      return (
        <div className="space-y-3">
          {p.concepts.map((c, i) => (
            <div key={i} className="rounded-lg border-s-4 border-keyidea bg-keyidea-bg/50 p-3">
              <p className="m-0 text-[1.15em] font-bold text-ink">
                {c.term}
                {c.enTerm && (
                  <Ltr as="span" className="ms-1.5 text-[0.78em] font-medium text-muted">
                    ({c.enTerm})
                  </Ltr>
                )}
              </p>
              <p className="m-0 mt-1 text-[1.02em] text-ink/85">{c.explanation}</p>
            </div>
          ))}
          {p.concepts.length === 0 && (
            <p className="text-muted">{slide.subtitle}</p>
          )}
        </div>
      );

    case "formula":
      return (
        <div className="space-y-2 text-[1.15em]">
          {p.formulas.map((f, i) => (
            <FormulaBox key={i} formula={f} />
          ))}
        </div>
      );

    case "example":
      return (
        <div className="space-y-2 text-[1.05em]">
          {p.examples.map((ex, i) => (
            <Callout key={`e${i}`} kind="example" label={t("example")}>
              {ex.text}
              {ex.sourceRef && (
                <Ltr as="span" className="ms-1 text-[0.82em] text-muted">
                  [{ex.sourceRef}]
                </Ltr>
              )}
            </Callout>
          ))}
          {p.mistakes.map((m, i) => (
            <Callout key={`m${i}`} kind="mistake" label={t("mistake")}>
              {m}
            </Callout>
          ))}
          {p.tips.map((tip, i) => (
            <Callout key={`t${i}`} kind="tip" label={t("tip")}>
              {tip}
            </Callout>
          ))}
        </div>
      );

    case "summary-comparisons":
      return (
        <div className="text-[1.05em]">
          <ComparisonSection pairs={p.pairs} t={t} />
        </div>
      );

    case "summary-concepts-traps":
      return (
        <div className="text-[1.1em]">
          <ConceptsTrapsSection
            concepts={p.criticalConcepts}
            traps={p.traps}
            t={t}
          />
        </div>
      );

    case "summary-sanity":
      return (
        <div className="grid gap-3 text-[1.02em] md:grid-cols-2">
          <SanityTable values={p.typicalValues} t={t} />
          <ChecklistSection items={p.checklist} t={t} />
        </div>
      );

    case "closing":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h1 className="text-[2.4em] font-extrabold text-navy">{slide.title}</h1>
          <p className="mt-3 text-[1.1em] text-muted">{p.examDate}</p>
        </div>
      );
  }
}

/**
 * Slide — one full-screen stage. navy heading (local + LTR EN term), framing
 * subtitle, scrollable body (overflow per spec §4.3). Centered kinds (title,
 * closing) manage their own vertical layout.
 */
export function Slide({
  slide,
  t,
  onJump,
}: {
  slide: DeckSlide;
  t: LabelFn;
  onJump?: (slideId: string) => void;
}) {
  const centered = slide.kind === "title" || slide.kind === "closing";
  return (
    <article className="flex h-full flex-col p-[clamp(1rem,3vw,2.5rem)]">
      {!centered && (
        <header className="mb-3 flex-none border-b border-lines pb-2">
          <h2 className="m-0 flex flex-wrap items-baseline gap-2 text-[1.7em] font-bold text-navy">
            <Stars level={slide.starLevel} />
            <span>{slide.title}</span>
            {slide.enTitle && (
              <Ltr as="span" className="text-[0.6em] font-medium text-muted">
                ({slide.enTitle})
              </Ltr>
            )}
          </h2>
          {slide.subtitle && slide.kind !== "concept" && (
            <p className="m-0 mt-1 text-[0.95em] italic text-muted">{slide.subtitle}</p>
          )}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${centered ? "" : "overflow-y-auto"}`}>
        <SlideBody slide={slide} t={t} onJump={onJump} />
      </div>
    </article>
  );
}
