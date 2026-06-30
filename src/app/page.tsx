import Link from "next/link";
import { listPacks } from "@/lib/coursepack/registry";
import { daysUntil } from "@/lib/date";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";

const PILLARS = [
  {
    icon: "📄",
    title: "דף נוסחאות",
    body: "בדיוק 2 עמודי A4, RTL מושלם, נוסחאות לטיניות/יוונית מוצגות LTR-נקיות.",
  },
  {
    icon: "🎬",
    title: "מצגת לימוד",
    body: "TOC עם כוכבים, פירוט לכל מושג ולכל נוסחה, ייצוא ל-HTML וגם ל-PowerPoint.",
  },
  {
    icon: "📅",
    title: "תכנית יומית",
    body: "ספירה לאחור עד המבחן, יום יום מצביע על השקופיות והתרגולים הנכונים.",
  },
  {
    icon: "🎯",
    title: "תרגול ומשוב",
    body: "מורה AI עם rubric — ציון תלת-צירי, צעד-אחר-צעד ✓/✗, ולמה.",
  },
];

export default async function Home() {
  const packs = await listPacks();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero */}
      <section className="hero-band rounded-3xl border border-lines/60 p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-semibold text-orange">
              <span aria-hidden>✨</span>
              ערכת הכנה למבחן מהחומר שלך
            </span>
            <h1 className="m-0 mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
              StudyPack
            </h1>
            <p className="mt-3 text-base text-ink/85 sm:text-lg">
              העלה PDF של ההרצאות והתרגולים. תוך 30 שניות תקבל ערכת הכנה מתואמת:
              דף נוסחאות מודפס, מצגת לימוד, תכנית יומית עד המבחן, ומורה AI
              שנותן משוב מפורט על הפתרונות שלך.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href="/ingest"
                className="rounded-md bg-orange px-4 py-2 text-sm font-semibold text-paper shadow-sm hover:brightness-95"
              >
                התחל — העלה חומרי קורס
              </Link>
              <Link
                href="/cheatsheet/hebrew-finance"
                className="rounded-md border border-navy bg-paper px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
              >
                ראה דמו (מימון תאגידי)
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/classes"
              className="rounded-md border border-lines bg-paper px-3 py-1.5 text-sm text-ink hover:bg-lines/40"
            >
              כיתות
            </Link>
            <AuthHeaderControls />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mt-10">
        <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">
          ארבעת הנדבכים
        </h2>
        <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <li
              key={p.title}
              className="card-lift animate-fade-in-up rounded-xl border border-lines bg-paper p-4 shadow-sm"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-2xl" aria-hidden>
                {p.icon}
              </span>
              <h3 className="m-0 mt-2 text-sm font-bold text-navy">{p.title}</h3>
              <p className="m-0 mt-1 text-xs leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Demo packs */}
      <section className="mt-10">
        <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">
          {packs.length === 0 ? "בוא נתחיל" : "דמואים מובנים"}
        </h2>

        {packs.length === 0 ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-lines bg-paper/60 p-8 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-orange/10 text-3xl">
              📚
            </div>
            <p className="m-0 text-base font-semibold text-ink">
              עוד אין ערכות לימוד אצלך
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              העלה PDF / PPTX / DOCX או הדבק טקסט וClaude תארגן את החומר
              לערכת CoursePack בנייה אחת.
            </p>
            <Link
              href="/ingest"
              className="mt-4 inline-flex items-center rounded-md bg-orange px-4 py-2 text-sm font-semibold text-paper hover:brightness-95"
            >
              + העלה חומרי קורס
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2">
            {packs.map((p, i) => {
              const days = daysUntil(p.course.examDate);
              const isHe = p.course.direction === "rtl";
              return (
                <li
                  key={p.course.id}
                  dir={p.course.direction}
                  lang={p.course.language}
                  className="card-lift animate-fade-in-up rounded-2xl border border-lines bg-paper p-4 shadow-sm"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="m-0 text-base font-bold text-navy">
                        {p.course.title}
                      </h3>
                      <p className="m-0 mt-0.5 text-xs text-muted">
                        {p.course.subject}
                      </p>
                    </div>
                    <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-orange">
                      {p.course.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>📅</span>
                      {isHe
                        ? `מבחן בעוד ${days >= 0 ? days : 0} ימים`
                        : `${days >= 0 ? days : 0} days to exam`}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>📚</span>
                      {p.blocks.length} {isHe ? "נושאים" : "topics"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    <Link
                      href={`/cheatsheet/${p.course.id}`}
                      className="rounded-md border border-lines bg-paper px-2 py-1.5 text-center text-xs font-medium text-ink hover:bg-lines/40"
                    >
                      📄 דף נוסחאות
                    </Link>
                    <Link
                      href={`/deck/${p.course.id}`}
                      className="rounded-md border border-lines bg-paper px-2 py-1.5 text-center text-xs font-medium text-ink hover:bg-lines/40"
                    >
                      🎬 מצגת
                    </Link>
                    <Link
                      href={`/plan/${p.course.id}`}
                      className="rounded-md bg-navy px-2 py-1.5 text-center text-xs font-bold text-paper hover:brightness-110"
                    >
                      📅 תכנית
                    </Link>
                    <Link
                      href={`/practice/${p.course.id}`}
                      className="rounded-md border border-orange bg-paper px-2 py-1.5 text-center text-xs font-medium text-orange hover:bg-orange/5"
                    >
                      🎯 תרגול
                    </Link>
                    <Link
                      href={`/verify/${p.course.id}`}
                      className="rounded-md border border-lines bg-paper px-2 py-1.5 text-center text-xs font-medium text-muted hover:bg-lines/40"
                    >
                      ✓ אימות
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-lines pt-4 text-center text-xs text-muted">
        StudyPack · עברית RTL · נוסחאות מושלמות בהדפסה · בקוד פתוח
      </footer>
    </main>
  );
}
