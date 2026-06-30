"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CoursePack } from "@/lib/coursepack/schema";
import { buildDeck } from "@/lib/deck/buildDeck";
import { makeLabels } from "@/lib/i18n/labels";
import { Slide } from "./Slide";

export function DeckViewer({ pack }: { pack: CoursePack }) {
  const slides = useMemo(() => buildDeck(pack), [pack]);
  const t = makeLabels(pack.course.outputLanguage);
  const dir = pack.course.direction;

  const [current, setCurrent] = useState(0);
  const total = slides.length;

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

  // dir-aware keyboard nav: in RTL the "forward" arrow is ArrowLeft.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
  }, [current, dir, go, total]);

  const pct = total > 1 ? (current / (total - 1)) * 100 : 100;

  return (
    <div dir={dir} lang={pack.course.language} className="flex h-dvh flex-col bg-[#eef1f5]">
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
        <h1 className="me-auto text-sm font-bold text-navy">{pack.course.title}</h1>
        <Link
          href={`/cheatsheet/${pack.course.id}`}
          className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
        >
          {t("cheatSheet")}
        </Link>
        <Link
          href={`/plan/${pack.course.id}`}
          className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
        >
          {t("plan")}
        </Link>
        <Link
          href={`/practice/${pack.course.id}`}
          className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
        >
          {t("practice")}
        </Link>
        <Link
          href={`/verify/${pack.course.id}`}
          className="rounded-md border border-lines px-2.5 py-1 text-xs text-muted hover:bg-lines/40"
        >
          {t("verify")}
        </Link>
        <a
          href={`/deck/${pack.course.id}/export`}
          download={`${pack.course.id}-deck.html`}
          className="rounded-md bg-navy px-2.5 py-1 text-xs font-semibold text-paper hover:brightness-110"
        >
          {t("downloadHtml")}
        </a>
        <a
          href={`/deck/${pack.course.id}/export-pptx`}
          download={`${pack.course.id}-deck.pptx`}
          className="rounded-md border border-navy px-2.5 py-1 text-xs font-semibold text-navy hover:bg-navy/10"
        >
          {t("downloadPptx")}
        </a>
      </div>

      {/* Stage */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-[clamp(0.5rem,2vw,2rem)]">
        <div className="aspect-video max-h-full w-full max-w-[1100px] overflow-hidden rounded-xl bg-paper shadow-lg">
          <Slide slide={slides[current]} t={t} onJump={jumpTo} />
        </div>
      </div>

      {/* Footer nav + counter */}
      <div className="flex flex-none items-center justify-center gap-6 border-t border-lines bg-paper px-4 py-2">
        <button
          type="button"
          onClick={() => go(current - 1)}
          disabled={current === 0}
          className="rounded-md border border-lines px-3 py-1 text-sm disabled:opacity-40"
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
          className="rounded-md border border-lines px-3 py-1 text-sm disabled:opacity-40"
        >
          {dir === "rtl" ? "←" : "→"}
        </button>
      </div>
    </div>
  );
}
