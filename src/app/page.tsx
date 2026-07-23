import Link from "next/link";
import { listPacks } from "@/lib/coursepack/registry";
import { daysUntil } from "@/lib/date";
import { buildCards } from "@/lib/flashcards/buildCards";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";
import { PackProgress } from "@/components/home/PackProgress";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const FEATURES = [
  {
    icon: "🃏",
    title: "כרטיסיות חכמות",
    body: "חזרה מרווחת שזוכרת מה שכחת",
    href: (id: string) => `/flashcards/${id}`,
  },
  {
    icon: "Σ",
    title: "דף נוסחאות",
    body: "כל הנוסחאות בעמוד אחד",
    href: (id: string) => `/cheatsheet/${id}`,
  },
  {
    icon: "📅",
    title: "תכנית עד המבחן",
    body: "מה ללמוד כל יום, בלי לחשוב",
    href: (id: string) => `/plan/${id}`,
  },
  {
    icon: "🎯",
    title: "תרגול ומשוב",
    body: "שאלות עם הסברים מיידיים",
    href: (id: string) => `/practice/${id}`,
  },
];

export default async function Home() {
  const packs = await listPacks();

  // Sort by soonest upcoming exam; the nearest one anchors the "today" card.
  const sorted = [...packs].sort((a, b) => {
    const da = daysUntil(a.course.examDate);
    const db = daysUntil(b.course.examDate);
    const na = da < 0 ? Infinity : da;
    const nb = db < 0 ? Infinity : db;
    return na - nb;
  });
  const focus = sorted[0];
  const focusDays = focus ? Math.max(0, daysUntil(focus.course.examDate)) : 0;
  const focusCards = focus ? buildCards(focus).length : 0;
  const focusPractice = focus
    ? focus.blocks.reduce((n, b) => n + (b.practiceItems?.length ?? 0), 0)
    : 0;
  const featureId = focus?.course.id ?? "";

  return (
    <div className="min-h-dvh">
      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-canvas/90 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink bg-navy text-paper shadow-[2px_2px_0_0_var(--color-ink)]">
              ⚡
            </span>
            <span className="text-lg font-black tracking-tight text-ink">
              סטאדיפאק
            </span>
          </Link>

          <div className="ms-auto flex items-center gap-2">
            {focus && (
              <span className="nb-pill hidden text-xs sm:inline-flex">
                <span aria-hidden>🔥</span>
                {focusDays} ימים למבחן הקרוב
              </span>
            )}
            <Link href="/classes" className="nb-btn px-3 py-1.5 text-sm">
              כיתות
            </Link>
            <ThemeToggle />
            <AuthHeaderControls />
            <Link href="/ingest" className="nb-btn nb-btn-primary px-3 py-1.5 text-sm">
              + חבילה חדשה
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* ── "What's left today" dark plate ────────────────────────────── */}
        {focus && (
          <section
            dir={focus.course.direction}
            className="nb-hero-dark animate-fade-in-up p-6 sm:p-8"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-md">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-lime">
                  המבחן הקרוב · {focus.course.title}
                </p>
                <h1 className="m-0 mt-2 text-3xl font-black leading-tight sm:text-4xl">
                  מה נשאר להיום?
                </h1>
                <p className="m-0 mt-2 text-sm text-paper/70">
                  {focusDays} ימים למבחן · {focus.blocks.length} נושאים
                </p>
              </div>

              <ul className="m-0 grid w-full gap-2.5 p-0 sm:max-w-xs">
                <TodoItem
                  href={`/flashcards/${focus.course.id}`}
                  label={`${focusCards} כרטיסיות לחזרה`}
                />
                <TodoItem
                  href={`/practice/${focus.course.id}`}
                  label={`תרגול: ${focusPractice} שאלות`}
                />
                <TodoItem
                  href={`/cheatsheet/${focus.course.id}`}
                  label="ריענון דף נוסחאות"
                />
              </ul>
            </div>
          </section>
        )}

        {/* ── Course cards ───────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="m-0 text-xs font-black uppercase tracking-wider text-muted">
            {packs.length === 0 ? "בוא נתחיל" : "הקורסים שלי"}
          </h2>

          {packs.length === 0 ? (
            <div className="nb-card mt-3 p-8 text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-lime text-3xl">
                📚
              </div>
              <p className="m-0 text-base font-black text-ink">
                עוד אין ערכות לימוד אצלך
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                העלה PDF / PPTX / DOCX או הדבק טקסט, ו-Claude תארגן את החומר לערכת
                לימוד מלאה.
              </p>
              <Link href="/ingest" className="nb-btn nb-btn-primary mt-4 px-4 py-2 text-sm">
                + העלה חומרי קורס
              </Link>
            </div>
          ) : (
            <ul className="m-0 mt-3 grid list-none gap-4 p-0 sm:grid-cols-2">
              {sorted.map((p, i) => {
                const days = Math.max(0, daysUntil(p.course.examDate));
                const isHe = p.course.direction === "rtl";
                const cardsN = buildCards(p).length;
                const urgent = daysUntil(p.course.examDate) >= 0 && days <= 14;
                return (
                  <li
                    key={p.course.id}
                    dir={p.course.direction}
                    lang={p.course.language}
                    className="nb-card nb-hover animate-fade-in-up p-5"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    {/* header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="m-0 text-lg font-black leading-tight text-ink">
                          {p.course.title}
                        </h3>
                        <p className="m-0 mt-0.5 text-xs text-muted">
                          {p.course.subject}
                        </p>
                      </div>
                    </div>

                    {/* countdown */}
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="m-0 text-xs font-bold text-muted">
                          {isHe ? "ימים למבחן" : "days to exam"}
                        </p>
                        <p className="m-0 mt-0.5 text-xs text-muted">
                          {p.course.examDate}
                        </p>
                      </div>
                      <span
                        className={`nb-numeral text-6xl ${urgent ? "text-navy" : "text-orange"}`}
                      >
                        {days}
                      </span>
                    </div>

                    {/* info pills */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="nb-pill text-[11px]">
                        🃏 {cardsN} כרטיסיות
                      </span>
                      <span className="nb-pill text-[11px]">
                        📚 {p.blocks.length} נושאים
                      </span>
                    </div>

                    <PackProgress packId={p.course.id} isHe={isHe} />

                    {/* actions */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={`/plan/${p.course.id}`}
                        className="nb-btn nb-btn-primary col-span-2 py-2 text-sm"
                      >
                        ממשיכים ללמוד ←
                      </Link>
                      <Link href={`/cheatsheet/${p.course.id}`} className="nb-btn py-1.5 text-xs">
                        📄 דף נוסחאות
                      </Link>
                      <Link href={`/deck/${p.course.id}`} className="nb-btn py-1.5 text-xs">
                        🎬 מצגת
                      </Link>
                      <Link href={`/flashcards/${p.course.id}`} className="nb-btn py-1.5 text-xs">
                        🃏 כרטיסיות
                      </Link>
                      <Link href={`/practice/${p.course.id}`} className="nb-btn py-1.5 text-xs">
                        🎯 תרגול
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Feature row ────────────────────────────────────────────────── */}
        <section className="mt-8">
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => {
              const inner = (
                <>
                  <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink bg-canvas text-xl font-black text-navy">
                    {f.icon}
                  </span>
                  <h3 className="m-0 mt-3 text-sm font-black text-ink">{f.title}</h3>
                  <p className="m-0 mt-1 text-xs leading-relaxed text-muted">
                    {f.body}
                  </p>
                </>
              );
              return (
                <li
                  key={f.title}
                  className="nb-card-sm animate-fade-in-up p-4"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  {featureId ? (
                    <Link href={f.href(featureId)} className="block">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="mt-12 border-t-2 border-ink pt-4 text-center text-xs font-bold text-muted">
          סטאדיפאק · עברית RTL · נוסחאות מושלמות בהדפסה
        </footer>
      </main>
    </div>
  );
}

function TodoItem({ href, label }: { href: string; label: string }) {
  return (
    <li className="m-0">
      <Link
        href={href}
        className="flex items-center gap-3 rounded-xl border-2 border-paper/25 bg-paper/5 px-4 py-3 text-sm font-bold text-paper transition-colors hover:bg-paper/10"
      >
        <span className="grid h-5 w-5 flex-none place-items-center rounded-md border-2 border-paper/40" aria-hidden />
        {label}
      </Link>
    </li>
  );
}
