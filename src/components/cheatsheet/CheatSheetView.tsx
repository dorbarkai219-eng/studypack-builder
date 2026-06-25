"use client";

import { useState } from "react";
import Link from "next/link";
import type { CoursePack } from "@/lib/coursepack/schema";
import { makeLabels, type LabelKey } from "@/lib/i18n/labels";
import { daysUntil } from "@/lib/date";
import { TopicBox } from "./TopicBox";
import {
  ComparisonSection,
  ConceptsTrapsSection,
  SanityTable,
  ChecklistSection,
} from "./Summaries";

type Density = "1page" | "2page" | "detailed";

export function CheatSheetView({ pack }: { pack: CoursePack }) {
  const [density, setDensity] = useState<Density>("2page");
  const { course, blocks, summaries } = pack;
  const t = makeLabels(course.outputLanguage);
  const dir = course.direction;
  const days = daysUntil(course.examDate);

  const densityOptions: { value: Density; label: LabelKey }[] = [
    { value: "1page", label: "d1" },
    { value: "2page", label: "d2" },
    { value: "detailed", label: "dDetailed" },
  ];

  return (
    <div dir={dir} lang={course.language}>
      {/* Toolbar — never printed */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-lines bg-paper/95 px-4 py-2 backdrop-blur">
        <div className="me-auto">
          <h1 className="m-0 text-base font-bold text-navy">
            {course.title} · {t("cheatSheet")}
          </h1>
          <p className="m-0 text-xs text-muted">
            {t("examIn")} {days >= 0 ? days : 0} {dir === "rtl" ? "ימים" : "days"} ·{" "}
            {course.subject}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted">{t("density")}:</span>
          <div className="inline-flex overflow-hidden rounded-md border border-lines">
            {densityOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setDensity(o.value)}
                aria-pressed={density === o.value}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  density === o.value
                    ? "bg-navy text-paper"
                    : "bg-paper text-ink hover:bg-lines/40"
                }`}
              >
                {t(o.label)}
              </button>
            ))}
          </div>
        </div>

        <Link
          href={`/deck/${course.id}`}
          className="rounded-md border border-lines px-3 py-1.5 text-sm text-ink hover:bg-lines/40"
        >
          {dir === "rtl" ? "מצגת" : "Deck"}
        </Link>

        <Link
          href={`/plan/${course.id}`}
          className="rounded-md border border-lines px-3 py-1.5 text-sm text-ink hover:bg-lines/40"
        >
          {dir === "rtl" ? "תכנית" : "Plan"}
        </Link>

        <Link
          href={`/verify/${course.id}`}
          className="rounded-md border border-lines px-3 py-1.5 text-sm text-muted hover:bg-lines/40"
        >
          {dir === "rtl" ? "אימות" : "Verify"}
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-orange px-3 py-1.5 text-sm font-semibold text-paper hover:brightness-95"
        >
          {t("printSave")}
        </button>
      </div>

      {/* The printable page */}
      <div className="py-4">
        <div className="cs-page">
          <div className={`cheatsheet density-${density}`}>
            {blocks
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((b) => (
                <TopicBox key={b.id} block={b} t={t} />
              ))}

            <ComparisonSection pairs={summaries.confusingPairs} t={t} />
            <ConceptsTrapsSection
              concepts={summaries.criticalConcepts}
              traps={summaries.traps}
              t={t}
            />
            <SanityTable values={summaries.typicalValues} t={t} />
            <ChecklistSection items={summaries.checklist} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
