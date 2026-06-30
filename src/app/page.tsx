import Link from "next/link";
import { listPacks } from "@/lib/coursepack/registry";
import { daysUntil } from "@/lib/date";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";

export default async function Home() {
  const packs = await listPacks();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Hero band */}
      <section className="hero-band rounded-2xl border border-lines/60 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="m-0 text-2xl sm:text-3xl font-bold text-navy tracking-tight">
              StudyPack Builder
            </h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base text-muted leading-relaxed">
              Coordinated, exam-ready study packs from your course materials —
              cheat sheet, learning deck, day-by-day plan, and a verification
              report, all generated from one CoursePack model.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/ingest"
              className="rounded-md bg-orange px-3 py-1.5 text-sm font-semibold text-paper shadow-sm hover:brightness-95"
            >
              <span className="hidden sm:inline">+ Ingest course materials</span>
              <span className="sm:hidden">+ Ingest</span>
            </Link>
            <AuthHeaderControls />
          </div>
        </div>
      </section>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
        {packs.length === 0 ? "Get started" : "Sample course packs"}
      </h2>

      {packs.length === 0 ? (
        <div className="mt-3 rounded-xl border-2 border-dashed border-lines bg-paper/60 p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-orange/10 text-2xl">
            📚
          </div>
          <p className="m-0 text-base font-semibold text-ink">
            No course packs yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Upload a PDF, PPTX, DOCX, or paste raw text and Claude will
            structure your materials into a CoursePack.
          </p>
          <Link
            href="/ingest"
            className="mt-4 inline-flex items-center rounded-md bg-orange px-4 py-2 text-sm font-semibold text-paper hover:brightness-95"
          >
            + Ingest course materials
          </Link>
        </div>
      ) : (
        <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2">
          {packs.map((p, i) => {
            const days = daysUntil(p.course.examDate);
            return (
              <li
                key={p.course.id}
                dir={p.course.direction}
                className="card-lift animate-fade-in-up rounded-xl border border-lines bg-paper p-4"
                style={{ animationDelay: `${i * 70}ms` }}
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/cheatsheet/${p.course.id}`}
                    className="rounded-md border border-lines px-3 py-1 text-sm text-ink hover:bg-lines/40"
                  >
                    <span className="hidden sm:inline">Cheat sheet</span>
                    <span className="sm:hidden">Sheet</span>
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
                    <span className="hidden sm:inline">Study plan</span>
                    <span className="sm:hidden">Plan</span>
                  </Link>
                  <Link
                    href={`/practice/${p.course.id}`}
                    className="rounded-md border border-lines px-3 py-1 text-sm text-ink hover:bg-lines/40"
                  >
                    Practice
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
      )}
    </main>
  );
}
