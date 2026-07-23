"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CoursePack } from "@/lib/coursepack/schema";
import { buildDeck } from "@/lib/deck/buildDeck";
import { makeLabels } from "@/lib/i18n/labels";
import { Slide } from "./Slide";

const posKey = (packId: string) => `studypack:deck:${packId}:pos`;

export function DeckViewer({ pack }: { pack: CoursePack }) {
  const slides = useMemo(() => buildDeck(pack), [pack]);
  const t = makeLabels(pack.course.outputLanguage);
  const dir = pack.course.direction;

  const [current, setCurrent] = useState(0);
  const [overview, setOverview] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const total = slides.length;

  // Resume where the reader left off (persisted per pack).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(posKey(pack.course.id));
      const idx = raw ? Number.parseInt(raw, 10) : NaN;
      if (Number.isInteger(idx) && idx > 0 && idx < slides.length) {
        setCurrent(idx);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [pack.course.id, slides.length]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(posKey(pack.course.id), String(current));
    } catch {
      /* ignore */
    }
  }, [current, hydrated, pack.course.id]);

  const go = useCallback(
    (next: number) => setCurrent(() => Math.min(total - 1, Math.max(0, next))),
    [total],
  );
  const jumpTo = useCallback(
    (slideId: string) => {
      const idx = slides.findIndex((s) => s.id === slideId);
      if (idx >= 0) setCurrent(idx);
    },
    [slides],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void rootRef.current?.requestFullscreen?.().catch(() => {
        /* unsupported / denied — non-fatal */
      });
    }
  }, []);

  // dir-aware keyboard nav: in RTL the "forward" arrow is ArrowLeft.
  // G toggles the overview grid, F fullscreen, Escape closes the grid.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOverview(false);
        return;
      }
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setOverview((o) => !o);
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (overview) return; // arrows navigate slides only when the grid is closed
      const fwd = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
      switch (e.key) {
        case fwd:
        case " ":
        case "PageDown":
          e.preventDefault();
          go(current + 1);
          break;
        case back:
        case "PageUp":
          e.preventDefault();
          go(current - 1);
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(total - 1);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, dir, go, total, overview, toggleFullscreen]);

  const pct = total > 1 ? (current / (total - 1)) * 100 : 100;

  return (
    <div
      ref={rootRef}
      dir={dir}
      lang={pack.course.language}
      className="flex h-dvh flex-col bg-canvas"
    >
      {/* Progress bar */}
      <div className="h-1 flex-none bg-lines">
        <div
          className="h-full bg-orange transition-[width]"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        />
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-none flex-wrap items-center gap-3 border-b border-lines bg-paper/95 px-4 py-2 backdrop-blur">
        <Link
          href="/"
          className="text-sm text-muted hover:text-ink"
          aria-label={t("back")}
        >
          ←
        </Link>
        <h1 className="me-auto text-sm font-black text-navy">{pack.course.title}</h1>
        <Link
          href={`/cheatsheet/${pack.course.id}`}
          className="nb-btn px-2.5 py-1 text-xs"
        >
          {t("cheatSheet")}
        </Link>
        <Link
          href={`/plan/${pack.course.id}`}
          className="nb-btn px-2.5 py-1 text-xs"
        >
          {t("plan")}
        </Link>
        <Link
          href={`/practice/${pack.course.id}`}
          className="nb-btn px-2.5 py-1 text-xs"
        >
          {t("practice")}
        </Link>
        <Link
          href={`/flashcards/${pack.course.id}`}
          className="nb-btn nb-btn-lime px-2.5 py-1 text-xs"
        >
          {t("flashcards")}
        </Link>
        <Link
          href={`/verify/${pack.course.id}`}
          className="nb-btn px-2.5 py-1 text-xs text-muted"
        >
          {t("verify")}
        </Link>
        <button
          type="button"
          onClick={() => setOverview((o) => !o)}
          aria-pressed={overview}
          title={`${t("overview")} (G)`}
          className={`px-2.5 py-1 text-xs ${
            overview
              ? "nb-btn nb-btn-primary"
              : "nb-btn"
          }`}
        >
          ⊞ {t("overview")}
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          title={`${t("fullscreen")} (F)`}
          aria-label={t("fullscreen")}
          className="nb-btn px-2.5 py-1 text-xs"
        >
          ⛶
        </button>
        <a
          href={`/deck/${pack.course.id}/export`}
          download={`${pack.course.id}-deck.html`}
          className="nb-btn nb-btn-primary px-2.5 py-1 text-xs"
        >
          {t("downloadHtml")}
        </a>
        <a
          href={`/deck/${pack.course.id}/export-pptx`}
          download={`${pack.course.id}-deck.pptx`}
          className="nb-btn px-2.5 py-1 text-xs text-navy"
        >
          {t("downloadPptx")}
        </a>
      </div>

      {/* Stage — slide, or the overview grid (G) */}
      {overview ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ul className="mx-auto grid max-w-5xl list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-4">
            {slides.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    go(i);
                    setOverview(false);
                  }}
                  aria-current={i === current}
                  className={`nb-card-sm nb-hover w-full p-2.5 text-start ${
                    i === current ? "ring-2 ring-orange" : ""
                  }`}
                >
                  <span dir="ltr" className="font-mono text-[10px] text-muted [unicode-bidi:isolate]">
                    {i + 1}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-navy">
                    {s.title}
                  </span>
                  {s.starLevel > 0 && (
                    <span className="text-[10px] text-orange">
                      {"★".repeat(s.starLevel)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-[clamp(0.5rem,2vw,2rem)]">
          <div className="aspect-video max-h-full w-full max-w-[1100px] overflow-hidden rounded-[22px] border-2 border-ink bg-paper shadow-[6px_7px_0_0_var(--color-ink)]">
            <Slide slide={slides[current]} t={t} onJump={jumpTo} />
          </div>
        </div>
      )}

      {/* Footer nav + counter */}
      <div className="flex flex-none items-center justify-center gap-6 border-t border-lines bg-paper px-4 py-2">
        <button
          type="button"
          onClick={() => go(current - 1)}
          disabled={current === 0}
          className="nb-btn px-3 py-1 text-sm disabled:opacity-40"
        >
          {dir === "rtl" ? "→" : "←"}
        </button>
        <span
          dir="ltr"
          className="font-mono text-sm text-muted [unicode-bidi:isolate]"
          aria-live="polite"
        >
          {current + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => go(current + 1)}
          disabled={current === total - 1}
          className="nb-btn px-3 py-1 text-sm disabled:opacity-40"
        >
          {dir === "rtl" ? "←" : "→"}
        </button>
      </div>
    </div>
  );
}
