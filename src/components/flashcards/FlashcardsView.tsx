"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CoursePack } from "@/lib/coursepack/schema";
import { buildCards, type Flashcard } from "@/lib/flashcards/buildCards";
import {
  isDue,
  rate,
  type CardStateMap,
  type Rating,
} from "@/lib/flashcards/scheduler";
import { makeLabels } from "@/lib/i18n/labels";
import { Ltr } from "@/components/cheatsheet/Ltr";

const storageKey = (packId: string) => `studypack:cards:${packId}`;

const KIND_CHIP: Record<
  Flashcard["kind"],
  { cls: string; he: string; en: string }
> = {
  concept: { cls: "bg-keyidea-bg text-keyidea", he: "מושג", en: "Concept" },
  formula: { cls: "bg-example-bg text-example", he: "נוסחה", en: "Formula" },
  pair: { cls: "bg-tip-bg text-tip", he: "השוואה", en: "Comparison" },
};

export function FlashcardsView({ pack }: { pack: CoursePack }) {
  const t = makeLabels(pack.course.outputLanguage);
  const dir = pack.course.direction;
  const isHe = pack.course.outputLanguage === "he";

  const cards = useMemo(() => buildCards(pack), [pack]);
  const byId = useMemo(
    () => new Map(cards.map((c) => [c.id, c])),
    [cards],
  );

  const [states, setStates] = useState<CardStateMap>({});
  const [queue, setQueue] = useState<string[]>([]);
  const [done, setDone] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted SRS state on mount, then build today's queue.
  // Same SSR-safe pattern as PlanView: server renders empty, client replays
  // localStorage exactly once on mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let stored: CardStateMap = {};
    try {
      const raw = localStorage.getItem(storageKey(pack.course.id));
      if (raw) stored = JSON.parse(raw);
    } catch {
      /* ignore corrupt storage */
    }
    const now = new Date();
    setStates(stored);
    setQueue(cards.filter((c) => isDue(stored[c.id], now)).map((c) => c.id));
    setDone(0);
    setFlipped(false);
    setHydrated(true);
  }, [pack.course.id, cards]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist SRS state on change (post-hydration only).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(pack.course.id), JSON.stringify(states));
    } catch {
      /* quota / private mode — non-fatal */
    }
  }, [states, hydrated, pack.course.id]);

  const currentId = queue[0];
  const current = currentId ? byId.get(currentId) : undefined;

  const grade = useCallback(
    (rating: Rating) => {
      if (!currentId) return;
      const now = new Date();
      setStates((s) => ({ ...s, [currentId]: rate(s[currentId], rating, now) }));
      setQueue((q) => {
        const rest = q.slice(1);
        // "again" recycles the card to the end of today's session.
        return rating === "again" ? [...rest, currentId] : rest;
      });
      if (rating !== "again") setDone((d) => d + 1);
      setFlipped(false);
    },
    [currentId],
  );

  const restart = useCallback(() => {
    setQueue(cards.map((c) => c.id));
    setDone(0);
    setFlipped(false);
  }, [cards]);

  // Keyboard: Space/Enter flips; 1-4 grade once the answer is visible.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (!current) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped) {
        const map: Record<string, Rating> = {
          "1": "again",
          "2": "hard",
          "3": "good",
          "4": "easy",
        };
        const rating = map[e.key];
        if (rating) {
          e.preventDefault();
          grade(rating);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, flipped, grade]);

  const total = done + queue.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const chip = current ? KIND_CHIP[current.kind] : undefined;

  return (
    <div
      dir={dir}
      lang={pack.course.language}
      className="flex min-h-dvh flex-col bg-canvas"
    >
      {/* Progress bar */}
      <div className="h-1 flex-none bg-lines">
        <div
          className="h-full bg-navy transition-[width]"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-none flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap border-b border-lines bg-paper/95 px-4 py-2 backdrop-blur [scrollbar-width:thin]">
        <Link href="/" className="shrink-0 text-sm text-muted hover:text-ink" aria-label={t("back")}>
          ←
        </Link>
        <div className="me-auto shrink-0">
          <h1 className="m-0 text-sm font-black text-navy">
            {pack.course.title} · {t("flashcards")}
          </h1>
          {hydrated && (
            <p className="m-0 text-xs text-muted">
              {queue.length} {t("remaining")} · {done} ✓
            </p>
          )}
        </div>
        <Link
          href={`/deck/${pack.course.id}`}
          className="nb-btn shrink-0 px-2.5 py-1 text-xs"
        >
          {t("deck")}
        </Link>
        <Link
          href={`/plan/${pack.course.id}`}
          className="nb-btn shrink-0 px-2.5 py-1 text-xs"
        >
          {t("plan")}
        </Link>
        <Link
          href={`/practice/${pack.course.id}`}
          className="nb-btn shrink-0 px-2.5 py-1 text-xs"
        >
          {t("practice")}
        </Link>
        <Link
          href={`/quiz/${pack.course.id}`}
          className="nb-btn nb-btn-lime shrink-0 px-2.5 py-1 text-xs"
        >
          {t("quiz")}
        </Link>
      </div>

      {/* Stage */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 p-4">
        {!hydrated ? null : current && chip ? (
          <>
            {/* Card */}
            <div className="flip-scene w-full max-w-xl">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                aria-pressed={flipped}
                className={`flip-card block min-h-[280px] w-full cursor-pointer text-start sm:min-h-[320px] ${
                  flipped ? "flipped" : ""
                }`}
              >
                {/* Front */}
                <div className="flip-face nb-card p-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip.cls}`}
                    >
                      {isHe ? chip.he : chip.en}
                    </span>
                    {current.starLevel > 0 && (
                      <span className="text-xs text-orange" aria-label={`רמת חשיבות ${current.starLevel} מתוך 2`}>
                        {"★".repeat(current.starLevel)}
                      </span>
                    )}
                    <span className="ms-auto truncate text-xs text-muted">
                      {current.blockTitle}
                    </span>
                  </div>
                  <p className="m-0 mt-6 text-xl font-bold leading-snug text-navy sm:text-2xl">
                    {current.front}
                    {current.frontEn && (
                      <Ltr className="ms-2 text-base font-medium text-muted">
                        {current.frontEn}
                      </Ltr>
                    )}
                  </p>
                  <p className="m-0 mt-auto pt-6 text-center text-xs text-muted">
                    {t("showAnswer")} ␣
                  </p>
                </div>
                {/* Back */}
                <div className="flip-face flip-back nb-card p-6">
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
                    {current.front}
                  </p>
                  {current.ltrBack ? (
                    <div className="mt-4 rounded-lg bg-formula-bg p-4">
                      <Ltr className="block whitespace-pre-wrap font-mono text-lg text-formula-ink">
                        {current.back}
                      </Ltr>
                    </div>
                  ) : (
                    <p className="m-0 mt-4 whitespace-pre-wrap text-base leading-relaxed text-ink">
                      {current.back}
                    </p>
                  )}
                  {current.termKey && current.termKey.length > 0 && (
                    <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted">
                      {current.termKey.map((k) => (
                        <div key={k.symbol} className="contents">
                          <dt className="m-0">
                            <Ltr className="font-mono font-semibold text-ink">
                              {k.symbol}
                            </Ltr>
                          </dt>
                          <dd className="m-0">{k.meaning}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </button>
            </div>

            {/* Rating buttons — appear once the answer is shown */}
            <div
              className={`flex w-full max-w-xl gap-2 transition-opacity ${
                flipped ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={!flipped}
            >
              <RatingButton label={t("again")} kbd="1" cls="nb-btn nb-btn-orange" onClick={() => grade("again")} disabled={!flipped} />
              <RatingButton label={t("hard")} kbd="2" cls="nb-btn" onClick={() => grade("hard")} disabled={!flipped} />
              <RatingButton label={t("good")} kbd="3" cls="nb-btn" onClick={() => grade("good")} disabled={!flipped} />
              <RatingButton label={t("easy")} kbd="4" cls="nb-btn nb-btn-lime" onClick={() => grade("easy")} disabled={!flipped} />
            </div>
          </>
        ) : (
          /* Session finished / nothing due */
          <div className="animate-fade-in-up nb-card w-full max-w-md p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-tip-bg text-3xl">
              <span aria-hidden>{done > 0 ? "🎉" : "✅"}</span>
            </div>
            <p className="m-0 mt-3 text-lg font-black text-navy">
              {done > 0 ? t("sessionDone") : t("allCaughtUp")}
            </p>
            {done > 0 && (
              <p className="m-0 mt-1 text-sm text-muted">
                {done} ✓ · {cards.length} {t("flashcards")}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={restart}
                className="nb-btn nb-btn-primary px-4 py-2 text-sm"
              >
                {t("studyAgain")}
              </button>
              <Link
                href={`/plan/${pack.course.id}`}
                className="nb-btn px-4 py-2 text-sm"
              >
                {t("plan")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingButton({
  label,
  kbd,
  cls,
  onClick,
  disabled,
}: {
  label: string;
  kbd: string;
  cls: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 px-2 py-2.5 text-sm ${cls}`}
    >
      {label}
      <span dir="ltr" className="ms-1.5 rounded border border-ink/30 px-1 font-mono text-[10px] text-muted">
        {kbd}
      </span>
    </button>
  );
}
