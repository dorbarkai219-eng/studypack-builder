"use client";

import { useState } from "react";
import Link from "next/link";
import type { CoursePack } from "@/lib/coursepack/schema";
import { makeLabels } from "@/lib/i18n/labels";

/**
 * QuizView — a self-checkable exam quiz (no AI, no cost). `choice` questions
 * (multiple-choice + true/false) grade instantly against the stored answer
 * with ✓/✗ + explanation; `open` questions reveal the model answer for
 * flashcard-style self-rating. Progress + score tracked in component state.
 */
export function QuizView({ pack }: { pack: CoursePack }) {
  const t = makeLabels(pack.course.outputLanguage);
  const dir = pack.course.direction;
  const questions = pack.quiz;

  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <main dir={dir} lang={pack.course.language} className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/" className="text-sm text-muted hover:text-ink" aria-label={t("back")}>
          → {t("home")}
        </Link>
        <div className="nb-card mt-6 p-8 text-center">
          <p className="m-0 text-base font-black text-ink">אין עדיין שאלות בוחן לקורס הזה.</p>
        </div>
      </main>
    );
  }

  const q = questions[i];
  const total = questions.length;
  const pct = Math.round((i / total) * 100);

  function pickOption(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setAnswered((a) => a + 1);
    if (idx === q.correct) setScore((s) => s + 1);
  }

  function advance() {
    setSelected(null);
    setRevealed(false);
    if (i + 1 >= total) setFinished(true);
    else setI((n) => n + 1);
  }

  function selfMark(knew: boolean) {
    setAnswered((a) => a + 1);
    if (knew) setScore((s) => s + 1);
    advance();
  }

  function restart() {
    setI(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setAnswered(0);
    setFinished(false);
  }

  return (
    <div dir={dir} lang={pack.course.language} className="flex min-h-dvh flex-col bg-canvas">
      {/* progress */}
      <div className="h-2 flex-none bg-lines">
        <div
          className="h-full bg-navy transition-[width]"
          style={{ width: `${finished ? 100 : pct}%` }}
          role="progressbar"
          aria-valuenow={finished ? 100 : pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* toolbar */}
      <div className="sticky top-0 z-10 flex flex-none flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap border-b-2 border-ink bg-paper/95 px-4 py-2 backdrop-blur">
        <Link href="/" className="shrink-0 text-sm text-muted hover:text-ink" aria-label={t("back")}>
          →
        </Link>
        <div className="me-auto shrink-0">
          <h1 className="m-0 text-sm font-black text-navy">
            {pack.course.title} · {t("quiz")}
          </h1>
          {!finished && (
            <p className="m-0 text-xs text-muted">
              {i + 1} / {total} · {t("score")}: {score}/{answered}
            </p>
          )}
        </div>
        <Link href={`/flashcards/${pack.course.id}`} className="nb-btn nb-btn-lime shrink-0 px-2.5 py-1 text-xs">
          {t("flashcards")}
        </Link>
        <Link href={`/cheatsheet/${pack.course.id}`} className="nb-btn shrink-0 px-2.5 py-1 text-xs">
          {t("cheatSheet")}
        </Link>
      </div>

      {/* stage */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4">
        {finished ? (
          <div className="nb-card animate-fade-in-up w-full max-w-md p-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-lime text-3xl">
              {score / total >= 0.7 ? "🎉" : "💪"}
            </div>
            <p className="m-0 mt-3 text-xl font-black text-ink">{t("quizDone")}</p>
            <p className="m-0 mt-1 text-sm text-muted">
              {t("score")}: <span className="font-mono font-bold text-navy">{score}</span> / {total}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={restart} className="nb-btn nb-btn-primary px-4 py-2 text-sm">
                {t("studyAgain")}
              </button>
              <Link href={`/cheatsheet/${pack.course.id}`} className="nb-btn px-4 py-2 text-sm">
                {t("cheatSheet")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl">
            <div className="nb-card p-5">
              {q.topic && (
                <span className="nb-pill nb-pill-blue text-[11px]">{q.topic}</span>
              )}
              <p className="m-0 mt-3 text-lg font-bold leading-snug text-ink">{q.prompt}</p>

              {/* choice question */}
              {q.kind === "choice" && (
                <div className="mt-4 grid gap-2">
                  {q.options.map((opt, idx) => {
                    const isCorrect = idx === q.correct;
                    const isChosen = idx === selected;
                    const decided = selected !== null;
                    const tone = !decided
                      ? "border-ink bg-paper hover:bg-canvas"
                      : isCorrect
                        ? "border-tip bg-tip-bg text-tip"
                        : isChosen
                          ? "border-mistake bg-mistake-bg text-mistake"
                          : "border-lines bg-paper text-muted";
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => pickOption(idx)}
                        disabled={decided}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-start text-sm font-semibold transition-colors ${tone}`}
                      >
                        <span
                          aria-hidden
                          className="grid h-5 w-5 flex-none place-items-center rounded-md border-2 border-current text-[11px]"
                        >
                          {decided && isCorrect ? "✓" : decided && isChosen ? "✗" : String.fromCharCode(0x5d0 + idx)}
                        </span>
                        <span className="min-w-0 flex-1 text-ink">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* open question */}
              {q.kind === "open" && (
                <div className="mt-4">
                  {!revealed ? (
                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className="nb-btn nb-btn-primary w-full py-2.5 text-sm"
                    >
                      {t("showAnswer")}
                    </button>
                  ) : (
                    <div className="rounded-xl border-2 border-ink bg-canvas p-3 text-sm leading-relaxed text-ink">
                      {q.answer}
                    </div>
                  )}
                </div>
              )}

              {/* explanation after a choice is decided */}
              {q.kind === "choice" && selected !== null && (
                <div
                  className={`mt-3 rounded-xl border-s-4 px-3 py-2 text-sm ${
                    selected === q.correct
                      ? "border-tip bg-tip-bg"
                      : "border-mistake bg-mistake-bg"
                  }`}
                >
                  <span
                    className={`font-black ${selected === q.correct ? "text-tip" : "text-mistake"}`}
                  >
                    {selected === q.correct ? t("correct") : t("incorrect")}{" "}
                  </span>
                  <span className="text-ink">{q.answer}</span>
                </div>
              )}
            </div>

            {/* footer actions */}
            <div className="mt-4 flex items-center justify-end gap-2">
              {q.kind === "choice" && selected !== null && (
                <button type="button" onClick={advance} className="nb-btn nb-btn-primary px-5 py-2 text-sm">
                  {i + 1 >= total ? t("quizDone") : t("next")} ←
                </button>
              )}
              {q.kind === "open" && revealed && (
                <>
                  <button type="button" onClick={() => selfMark(false)} className="nb-btn nb-btn-orange px-4 py-2 text-sm">
                    {t("missedIt")}
                  </button>
                  <button type="button" onClick={() => selfMark(true)} className="nb-btn nb-btn-lime px-4 py-2 text-sm">
                    {t("gotIt")} ✓
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
