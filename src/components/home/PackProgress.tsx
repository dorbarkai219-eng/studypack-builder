"use client";

import { useEffect, useState } from "react";
import { countDue, type CardStateMap } from "@/lib/flashcards/scheduler";

/**
 * PackProgress — small client-side strip on each home-page pack card:
 * plan completion (written by PlanView as a {done,total} summary) and
 * how many flashcards are due today. Renders nothing until mounted and
 * nothing at all when the user hasn't started yet.
 */

interface PlanSummary {
  done: number;
  total: number;
}

export function PackProgress({ packId, isHe }: { packId: string; isHe: boolean }) {
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [due, setDue] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`studypack:plan:${packId}:summary`);
      if (raw) {
        const s = JSON.parse(raw) as PlanSummary;
        if (typeof s.done === "number" && typeof s.total === "number" && s.total > 0) {
          setPlan(s);
        }
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(`studypack:cards:${packId}`);
      if (raw) {
        setDue(countDue(JSON.parse(raw) as CardStateMap, new Date()));
      }
    } catch {
      /* ignore */
    }
  }, [packId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!plan && due === 0) return null;

  const pct = plan ? Math.round((plan.done / plan.total) * 100) : 0;

  return (
    <div className="mt-3 space-y-1.5">
      {plan && (
        <div className="flex items-center gap-2">
          <div className="nb-progress nb-progress-lime h-2.5 flex-1">
            <span
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span dir="ltr" className="font-mono text-[10px] text-muted [unicode-bidi:isolate]">
            {pct}%
          </span>
        </div>
      )}
      {due > 0 && (
        <p className="m-0 text-[11px] font-medium text-orange">
          🃏 {due} {isHe ? "כרטיסיות לחזרה היום" : "cards due today"}
        </p>
      )}
    </div>
  );
}
