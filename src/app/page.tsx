import Link from "next/link";
import { listPacks } from "@/lib/coursepack/registry";
import { daysUntil } from "@/lib/date";

export default function Home() {
  const packs = listPacks();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-navy">StudyPack Builder</h1>
      <p className="mt-1 text-muted">
        Coordinated, exam-ready study packs from your course materials. Milestone 1:
        the print-perfect, RTL-correct cheat-sheet renderer.
      </p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Sample course packs
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {packs.map((p) => {
          const days = daysUntil(p.course.examDate);
          return (
            <li
              key={p.course.id}
              dir={p.course.direction}
              className="rounded-lg border border-lines bg-paper p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-navy">{p.course.title}</span>
                <span className="rounded bg-orange/15 px-1.5 py-0.5 text-xs font-semibold text-orange">
                  {p.course.direction.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {p.course.subject} · exam in {days >= 0 ? days : 0} days ·{" "}
                {p.blocks.length} topics
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/cheatsheet/${p.course.id}`}
                  className="rounded-md border border-lines px-3 py-1 text-sm text-ink hover:bg-lines/40"
                >
                  Cheat sheet
                </Link>
                <Link
                  href={`/deck/${p.course.id}`}
                  className="rounded-md border border-lines px-3 py-1 text-sm text-ink hover:bg-lines/40"
                >
                  Deck
                </Link>
                <Link
                  href={`/plan/${p.course.id}`}
                  className="rounded-md bg-navy px-3 py-1 text-sm font-semibold text-paper hover:brightness-110"
                >
                  Study plan
                </Link>
                <Link
                  href={`/verify/${p.course.id}`}
                  className="rounded-md border border-lines px-3 py-1 text-sm text-muted hover:bg-lines/40"
                >
                  Verify
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
