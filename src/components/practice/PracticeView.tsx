"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CoursePack, Block, PracticeItem } from "@/lib/coursepack/schema";
import type { Feedback } from "@/lib/feedback/grade";
import { makeLabels } from "@/lib/i18n/labels";

type GradeState =
  | { kind: "idle" }
  | { kind: "grading" }
  | { kind: "ok"; feedback: Feedback }
  | { kind: "error"; message: string };

export function PracticeView({ pack }: { pack: CoursePack }) {
  const t = makeLabels(pack.course.outputLanguage);
  const dir = pack.course.direction;
  const isHe = pack.course.outputLanguage === "he";

  // Only blocks with both a rubric AND ≥1 practice item are practiceable.
  const blocks = useMemo(
    () => pack.blocks.filter((b) => b.rubric && b.practiceItems.length > 0),
    [pack.blocks],
  );

  const [activeBlock, setActiveBlock] = useState<Block | null>(blocks[0] ?? null);
  const [activeItem, setActiveItem] = useState<PracticeItem | null>(
    blocks[0]?.practiceItems[0] ?? null,
  );
  const [submission, setSubmission] = useState("");
  const [state, setState] = useState<GradeState>({ kind: "idle" });

  function pickBlock(b: Block) {
    setActiveBlock(b);
    setActiveItem(b.practiceItems[0] ?? null);
    setSubmission("");
    setState({ kind: "idle" });
  }
  function pickItem(it: PracticeItem) {
    setActiveItem(it);
    setSubmission("");
    setState({ kind: "idle" });
  }

  async function onGrade() {
    if (!activeBlock || !activeItem || !submission.trim()) return;
    setState({ kind: "grading" });
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packId: pack.course.id,
          blockId: activeBlock.id,
          itemId: activeItem.id,
          submission,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        feedback?: Feedback;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.feedback) {
        setState({ kind: "error", message: json.error ?? `HTTP ${res.status}` });
        return;
      }
      setState({ kind: "ok", feedback: json.feedback });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "שגיאת רשת",
      });
    }
  }

  if (blocks.length === 0) {
    return (
      <main
        dir={dir}
        lang={pack.course.language}
        className="mx-auto max-w-3xl px-6 py-10"
      >
        <ToolbarHeader pack={pack} />
        <div className="mt-6 rounded-xl border-2 border-dashed border-lines bg-paper/60 p-8 text-center">
          <p className="m-0 text-base font-semibold text-ink">
            {isHe
              ? "אין עדיין שאלות תרגול לפאק הזה"
              : "No practice items defined for this pack yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {isHe
              ? "כדי לתרגל, כל נושא צריך שאלות תרגול — לקורס הזה עדיין לא הוגדרו."
              : "Each block needs a rubric and ≥1 practiceItems entry to enable tutored feedback."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={dir}
      lang={pack.course.language}
      className="mx-auto max-w-5xl px-4 py-6"
    >
      <ToolbarHeader pack={pack} />

      <div className="mt-5 grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Topic + item picker */}
        <aside className="nb-card p-3">
          <h2 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {isHe ? "נושאים" : "Topics"}
          </h2>
          <ul className="m-0 grid list-none gap-1 p-0">
            {blocks.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => pickBlock(b)}
                  className={`w-full justify-start px-2.5 py-1.5 text-start text-sm ${
                    activeBlock?.id === b.id
                      ? "nb-btn nb-btn-primary"
                      : "nb-btn"
                  }`}
                >
                  {"★".repeat(b.starLevel)} {b.title}
                </button>
              </li>
            ))}
          </ul>

          {activeBlock && (
            <>
              <h2 className="m-0 mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
                {isHe ? "שאלות" : "Practice items"}
              </h2>
              <ul className="m-0 grid list-none gap-1 p-0">
                {activeBlock.practiceItems.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => pickItem(it)}
                      className={`w-full justify-start px-2.5 py-1.5 text-start text-xs ${
                        activeItem?.id === it.id
                          ? "nb-btn nb-btn-orange"
                          : "nb-btn"
                      }`}
                    >
                      {it.title}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>

        {/* Practice + submission + feedback */}
        <section className="grid gap-4">
          {activeBlock && activeItem && (
            <article className="nb-card p-4">
              <header className="mb-3 flex flex-wrap items-baseline gap-2 border-b border-lines pb-2">
                <span className="nb-pill nb-pill-blue px-2 py-0.5 text-xs">
                  {activeBlock.title}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {activeItem.title}
                </span>
                {activeItem.sourceRef && (
                  <span className="ms-auto font-mono text-xs text-muted">
                    {activeItem.sourceRef}
                  </span>
                )}
              </header>
              <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {activeItem.prompt}
              </p>
              {activeBlock.rubric?.topTrap && (
                <p className="mt-3 rounded-md border-s-4 border-mistake bg-mistake-bg px-3 py-2 text-xs text-mistake">
                  <strong>{isHe ? "מלכודת" : "Top trap"}: </strong>
                  {activeBlock.rubric.topTrap}
                </p>
              )}
            </article>
          )}

          <article className="nb-card p-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
              {isHe ? "התשובה שלך" : "Your answer"}
            </label>
            <textarea
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              rows={8}
              placeholder={
                isHe
                  ? "כתוב את הפתרון שלך כאן. הסבר את גישתך, השתמש בנוסחאות, ופרש את התוצאה."
                  : "Write your solution here — explain your approach, use the formulas, interpret the result."
              }
              className="mt-2 w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 text-sm leading-relaxed text-ink focus:border-keyidea"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGrade}
                disabled={state.kind === "grading" || !submission.trim()}
                className="nb-btn nb-btn-orange px-4 py-1.5 text-sm disabled:opacity-50"
              >
                {state.kind === "grading"
                  ? isHe
                    ? "מעריך…"
                    : "Grading…"
                  : isHe
                    ? "קבל משוב"
                    : "Get feedback"}
              </button>
              {state.kind === "grading" && (
                <span className="text-xs text-muted">
                  {isHe
                    ? "המורה האישי קורא את ההגשה, מאתר את הצעדים ונותן ציון לשלושה צירים…"
                    : "The tutor is reading your submission, locating each step, and scoring the three axes…"}
                </span>
              )}
              {state.kind === "error" && (
                <span role="alert" className="text-sm text-mistake">{state.message}</span>
              )}
            </div>
          </article>

          {state.kind === "ok" && (
            <FeedbackPanel
              feedback={state.feedback}
              isHe={isHe}
              pack={pack}
              activeBlock={activeBlock}
              t={t}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function FeedbackPanel({
  feedback,
  isHe,
  pack,
  activeBlock,
  t,
}: {
  feedback: Feedback;
  isHe: boolean;
  pack: CoursePack;
  activeBlock: Block | null;
  t: ReturnType<typeof makeLabels>;
}) {
  const overall = Math.round(
    (feedback.scores.approach +
      feedback.scores.execution +
      feedback.scores.interpretation) /
      3,
  );
  const confidencePct = Math.round(feedback.confidence * 100);

  return (
    <article aria-live="polite" className="nb-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-lines pb-2">
        <h2 className="m-0 text-base font-bold text-ink">
          {isHe ? "משוב" : "Feedback"}
        </h2>
        <span className="text-xs text-muted">
          {isHe ? "ביטחון" : "Confidence"}:{" "}
          <span className="font-mono">{confidencePct}%</span>
        </span>
      </header>
      <p className="mt-2 text-sm text-ink">{feedback.summary}</p>

      {/* Three-axis scores */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ScorePill label={isHe ? "גישה" : "Approach"} score={feedback.scores.approach} />
        <ScorePill label={isHe ? "ביצוע" : "Execution"} score={feedback.scores.execution} />
        <ScorePill
          label={isHe ? "פרשנות" : "Interpretation"}
          score={feedback.scores.interpretation}
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        {isHe ? "ממוצע" : "Overall"}: <strong>{overall}/10</strong>
      </p>

      {/* Top trap acknowledgment */}
      {feedback.fellIntoTopTrap && (
        <div className="mt-4 rounded-md border-s-4 border-mistake bg-mistake-bg px-3 py-2 text-sm text-mistake">
          {isHe
            ? "⚠️ נפלת במלכודת המרכזית של הבלוק הזה."
            : "⚠️ You fell into this block's top trap."}
        </div>
      )}

      {/* Rubric coverage */}
      {(feedback.rubricCovered.length > 0 || feedback.rubricMissed.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-tip/30 bg-tip-bg p-3">
            <h3 className="m-0 mb-1 text-xs font-bold uppercase tracking-wide text-tip">
              {isHe ? "מה היה ✓" : "Covered ✓"}
            </h3>
            <ul className="m-0 grid list-disc gap-0.5 ps-5 text-xs text-ink">
              {feedback.rubricCovered.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
              {feedback.rubricCovered.length === 0 && (
                <li className="list-none text-muted">—</li>
              )}
            </ul>
          </div>
          <div className="rounded-md border border-mistake/30 bg-mistake-bg p-3">
            <h3 className="m-0 mb-1 text-xs font-bold uppercase tracking-wide text-mistake">
              {isHe ? "מה חסר ✗" : "Missing ✗"}
            </h3>
            <ul className="m-0 grid list-disc gap-0.5 ps-5 text-xs text-ink">
              {feedback.rubricMissed.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
              {feedback.rubricMissed.length === 0 && (
                <li className="list-none text-muted">—</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Step-by-step diagnosis */}
      {feedback.steps.length > 0 && (
        <div className="mt-4">
          <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {isHe ? "שלב אחר שלב" : "Step by step"}
          </h3>
          <ol className="m-0 grid list-none gap-2 p-0">
            {feedback.steps.map((s, i) => (
              <li
                key={i}
                className={`rounded-md border p-2.5 text-sm ${
                  s.status === "correct"
                    ? "border-tip/30 bg-tip-bg"
                    : s.status === "partial"
                      ? "border-example/30 bg-example-bg"
                      : "border-mistake/30 bg-mistake-bg"
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-base ${
                      s.status === "correct"
                        ? "text-tip"
                        : s.status === "partial"
                          ? "text-example"
                          : "text-mistake"
                    }`}
                    aria-hidden
                  >
                    {s.status === "correct" ? "✓" : s.status === "partial" ? "≈" : "✗"}
                  </span>
                  <span className="font-semibold text-ink">{s.what}</span>
                </div>
                <p className="m-0 mt-1 text-xs text-ink/80">{s.why}</p>
                {s.fix && (
                  <p className="m-0 mt-1 text-xs">
                    <strong className="text-tip">{isHe ? "תיקון: " : "Fix: "}</strong>
                    <span className="text-ink">{s.fix}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Links back to deck slide + cheat section */}
      {activeBlock && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-lines pt-3 text-xs">
          <Link
            href={`/cheatsheet/${pack.course.id}#${activeBlock.id}`}
            className="nb-btn px-2.5 py-1"
          >
            {t("cheatSheet")}
          </Link>
          <Link
            href={`/deck/${pack.course.id}`}
            className="nb-btn px-2.5 py-1"
          >
            {t("deck")}
          </Link>
          <Link
            href={`/verify/${pack.course.id}`}
            className="nb-btn px-2.5 py-1 text-muted"
          >
            {t("verify")}
          </Link>
          <a
            href={`mailto:dorbarkai219@gmail.com?subject=Bad feedback report&body=Pack: ${encodeURIComponent(pack.course.id)}, Block: ${encodeURIComponent(activeBlock.id)}, Confidence: ${confidencePct}%`}
            className="nb-btn ms-auto px-2.5 py-1 text-muted"
          >
            {isHe ? "דווח על משוב לא נכון" : "Report bad feedback"}
          </a>
        </div>
      )}
    </article>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const color =
    score >= 7 ? "text-tip bg-tip-bg" : score >= 4 ? "text-example bg-example-bg" : "text-mistake bg-mistake-bg";
  return (
    <div
      className={`rounded-xl border-2 border-ink ${color} p-2 text-center`}
      role="img"
      aria-label={`${label}: ${score}/10`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide">{label}</div>
      <div className="mt-0.5 text-xl font-bold">{score}<span className="text-xs opacity-60">/10</span></div>
    </div>
  );
}

function ToolbarHeader({ pack }: { pack: CoursePack }) {
  const isHe = pack.course.outputLanguage === "he";
  const t = makeLabels(pack.course.outputLanguage);
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-lines pb-3">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← {t("home")}
        </Link>
        <h1 className="m-0 mt-1 text-xl font-black text-navy">
          {pack.course.title} · {isHe ? "תרגול" : "Practice"}
        </h1>
        <p className="m-0 text-sm text-muted">
          {isHe
            ? "הגש פתרון לשאלה ותקבל משוב מפורט, ציון לשלושה צירים, ורמת ביטחון."
            : "Submit a solution and get step-by-step feedback, three-axis scoring, and a confidence read."}
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/cheatsheet/${pack.course.id}`}
          className="nb-btn px-2.5 py-1 text-xs"
        >
          {t("cheatSheet")}
        </Link>
        <Link
          href={`/deck/${pack.course.id}`}
          className="nb-btn px-2.5 py-1 text-xs"
        >
          {t("deck")}
        </Link>
        <Link
          href={`/plan/${pack.course.id}`}
          className="nb-btn px-2.5 py-1 text-xs"
        >
          {t("plan")}
        </Link>
        <Link
          href={`/flashcards/${pack.course.id}`}
          className="nb-btn nb-btn-lime px-2.5 py-1 text-xs"
        >
          {t("flashcards")}
        </Link>
      </div>
    </header>
  );
}
