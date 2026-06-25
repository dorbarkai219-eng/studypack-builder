"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CoursePack } from "@/lib/coursepack/schema";
import { buildPlan } from "@/lib/plan/buildPlan";
import { daysUntil } from "@/lib/date";
import { Ltr } from "@/components/cheatsheet/Ltr";
import { makeLabels } from "@/lib/i18n/labels";

type Checked = Record<string, boolean>;

const storageKey = (packId: string) => `studypack:plan:${packId}`;

function taskId(day: number, kind: "learn" | "practice", i: number) {
  return `d${day}-${kind}-${i}`;
}

export function PlanView({ pack }: { pack: CoursePack }) {
  const t = makeLabels(pack.course.outputLanguage);
  const dir = pack.course.direction;
  const days = Math.max(1, daysUntil(pack.course.examDate));
  const plan = useMemo(() => buildPlan(pack, days), [pack, days]);

  const allTaskIds = useMemo(
    () =>
      plan.flatMap((d) => [
        ...d.learn.map((_, i) => taskId(d.day, "learn", i)),
        ...d.practice.map((_, i) => taskId(d.day, "practice", i)),
      ]),
    [plan],
  );

  const [checked, setChecked] = useState<Checked>({});
  const [hydrated, setHydrated] = useState(false);

  // Load persisted progress on mount (spec §4.5 — survives reload).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(pack.course.id));
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [pack.course.id]);

  // Persist on change (after hydration so we never clobber stored state).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(pack.course.id), JSON.stringify(checked));
    } catch {
      /* quota / private mode — non-fatal */
    }
  }, [checked, hydrated, pack.course.id]);

  const toggle = (id: string) =>
    setChecked((c) => ({ ...c, [id]: !c[id] }));

  const doneCount = allTaskIds.filter((id) => checked[id]).length;
  const total = allTaskIds.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const reset = () => setChecked({});

  return (
    <div dir={dir} lang={pack.course.language} className="min-h-dvh bg-[#eef1f5]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-lines bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ←
          </Link>
          <div className="me-auto">
            <h1 className="m-0 text-base font-bold text-navy">
              {pack.course.title} · {t("studyPlan")}
            </h1>
            <p className="m-0 text-xs text-muted">
              {t("examIn")} {days} {t("examInDays")} · {plan.length} {t("studyDays")}
            </p>
          </div>
          <Link
            href={`/deck/${pack.course.id}`}
            className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
          >
            {t("deck")}
          </Link>
          <Link
            href={`/cheatsheet/${pack.course.id}`}
            className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
          >
            {t("cheatSheet")}
          </Link>
          <Link
            href={`/verify/${pack.course.id}`}
            className="rounded-md border border-lines px-2.5 py-1 text-xs text-muted hover:bg-lines/40"
          >
            {t("verify")}
          </Link>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-lines px-2.5 py-1 text-xs text-muted hover:bg-lines/40"
          >
            {t("reset")}
          </button>
        </div>
        {/* Global progress */}
        <div className="mx-auto mt-2 flex max-w-5xl items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-lines">
            <div
              className="h-full bg-tip transition-[width]"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span dir="ltr" className="font-mono text-xs text-muted [unicode-bidi:isolate]">
            {doneCount}/{total} · {pct}%
          </span>
        </div>
      </div>

      {/* Day cards */}
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-5">
        {plan.map((d) => {
          const dayTasks = [
            ...d.learn.map((_, i) => taskId(d.day, "learn", i)),
            ...d.practice.map((_, i) => taskId(d.day, "practice", i)),
          ];
          const dayDone = dayTasks.every((id) => checked[id]) && dayTasks.length > 0;
          return (
            <section
              key={d.day}
              className={`rounded-xl border bg-paper p-4 shadow-sm transition-colors ${
                dayDone ? "border-tip/60" : "border-lines"
              }`}
            >
              <header className="mb-2 flex flex-wrap items-baseline gap-2 border-b border-lines pb-2">
                <span className="rounded-md bg-navy px-2 py-0.5 text-sm font-bold text-paper">
                  {t("day")} {d.day}
                </span>
                {d.star && <span className="text-orange">★</span>}
                <span className="rounded bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
                  {d.phase}
                </span>
                <span className="text-sm text-ink/85">{d.goal}</span>
                {dayDone && <span className="ms-auto text-tip">✓</span>}
              </header>

              {/* Slide reference strip (plan ↔ deck alignment, spec §3.7) */}
              {d.slideRefs.length > 0 && (
                <div className="mb-3 rounded-lg bg-keyidea-bg/50 px-3 py-2">
                  <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-keyidea">
                    {t("slidesInDeck")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.slideRefs.map((title, i) => (
                      <span
                        key={i}
                        className="rounded border border-keyidea/30 bg-paper px-1.5 py-0.5 text-xs text-ink"
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <TaskColumn
                  title={t("learn")}
                  accent="text-keyidea"
                  tasks={d.learn}
                  idFor={(i) => taskId(d.day, "learn", i)}
                  checked={checked}
                  onToggle={toggle}
                />
                <TaskColumn
                  title={t("practice")}
                  accent="text-example"
                  tasks={d.practice}
                  idFor={(i) => taskId(d.day, "practice", i)}
                  checked={checked}
                  onToggle={toggle}
                />
              </div>

              {d.materials && (
                <p className="m-0 mt-3 border-t border-lines pt-2 text-xs text-muted">
                  {t("materials")}:{" "}
                  <Ltr as="span">{d.materials}</Ltr>
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskColumn({
  title,
  accent,
  tasks,
  idFor,
  checked,
  onToggle,
}: {
  title: string;
  accent: string;
  tasks: { task: string; done: boolean }[];
  idFor: (i: number) => string;
  checked: Checked;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h3 className={`m-0 mb-1.5 text-sm font-bold uppercase tracking-wide ${accent}`}>
        {title}
      </h3>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {tasks.map((t, i) => {
          const id = idFor(i);
          const on = !!checked[id];
          return (
            <li key={id}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggle(id)}
                  className="mt-0.5 h-4 w-4 flex-none accent-tip"
                />
                <span className={on ? "text-muted line-through" : "text-ink"}>
                  {t.task}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
