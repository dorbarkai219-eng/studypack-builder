import Link from "next/link";
import type { CoursePack } from "@/lib/coursepack/schema";
import { verifyPack, type Finding, type Severity } from "@/lib/verify/verifyPack";

const SEV_STYLES: Record<Severity, { dot: string; ink: string; bg: string; label: string }> = {
  error: { dot: "bg-[#c0322b]", ink: "text-[#7a1f1c]", bg: "bg-[#fdecec]", label: "ERROR" },
  warn: { dot: "bg-[#b45309]", ink: "text-[#7a3a06]", bg: "bg-[#fdf4e3]", label: "WARN" },
  info: { dot: "bg-[#2563eb]", ink: "text-[#1d4ed8]", bg: "bg-[#eff4ff]", label: "INFO" },
};

function CoverageBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "#15803d" : pct >= 60 ? "#b45309" : "#c0322b";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-ink">{label}</span>
        <span className="font-mono text-muted">{pct}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-lines"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full transition-[width]" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function FindingRow({ f }: { f: Finding }) {
  const s = SEV_STYLES[f.severity];
  return (
    <li className={`flex flex-col gap-1 rounded-md border border-lines ${s.bg} p-3`}>
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
        <span className={`text-[10px] font-bold tracking-wider ${s.ink}`}>{s.label}</span>
        <span className="font-mono text-[11px] text-muted">{f.code}</span>
      </div>
      <p dir="ltr" className="m-0 text-sm text-ink [unicode-bidi:isolate]">
        {f.message}
      </p>
      {f.where && (
        <p dir="ltr" className="m-0 font-mono text-[11px] text-muted [unicode-bidi:isolate]">
          {f.where}
        </p>
      )}
    </li>
  );
}

export function VerifyView({ pack }: { pack: CoursePack }) {
  const report = verifyPack(pack);
  const isHe = pack.course.outputLanguage === "he";
  const dir = pack.course.direction;
  const grouped: Record<Severity, Finding[]> = { error: [], warn: [], info: [] };
  for (const f of report.findings) grouped[f.severity].push(f);

  return (
    <main dir={dir} lang={pack.course.language} className="mx-auto max-w-3xl px-6 py-8">
      <header className="sticky top-0 z-10 -mx-6 -mt-8 mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-lines bg-paper/95 px-6 pb-3 pt-6 backdrop-blur">
        <div>
          <Link href="/" className="text-sm text-muted hover:text-ink">
            {dir === "rtl" ? "←" : "←"} {isHe ? "בית" : "Home"}
          </Link>
          <h1 className="m-0 mt-1 text-xl font-bold text-navy">
            {pack.course.title} · {isHe ? "אימות" : "Verify"}
          </h1>
          <p className="m-0 text-sm text-muted">
            {isHe
              ? "מעבר על מקורות, מבנה ויישור הצלבה בין החפצים — §7 נגד הזיות"
              : "Provenance, structure + cross-artifact alignment (spec §7 anti-hallucination)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/cheatsheet/${pack.course.id}`}
            className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
          >
            {isHe ? "דף נוסחאות" : "Cheat sheet"}
          </Link>
          <Link
            href={`/deck/${pack.course.id}`}
            className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
          >
            {isHe ? "מצגת" : "Deck"}
          </Link>
          <Link
            href={`/plan/${pack.course.id}`}
            className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
          >
            {isHe ? "תכנית" : "Plan"}
          </Link>
          <Link
            href={`/practice/${pack.course.id}`}
            className="rounded-md border border-lines px-2.5 py-1 text-xs text-ink hover:bg-lines/40"
          >
            {isHe ? "תרגול" : "Practice"}
          </Link>
          <Link
            href={`/flashcards/${pack.course.id}`}
            className="rounded-md border border-tip px-2.5 py-1 text-xs font-medium text-tip hover:bg-tip/5"
          >
            {isHe ? "כרטיסיות" : "Flashcards"}
          </Link>
        </div>
      </header>

      {/* Summary counts */}
      <section className="mt-5 grid grid-cols-3 gap-3">
        {(["error", "warn", "info"] as Severity[]).map((sev) => {
          const s = SEV_STYLES[sev];
          return (
            <div key={sev} className={`rounded-lg border border-lines ${s.bg} p-3`}>
              <div className={`text-[10px] font-bold tracking-wider ${s.ink}`}>{s.label}</div>
              <div className="mt-0.5 text-2xl font-bold text-ink">{report.counts[sev]}</div>
            </div>
          );
        })}
      </section>

      {/* Coverage */}
      <section className="mt-5 grid gap-3 rounded-lg border border-lines bg-paper p-4">
        <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted">
          {isHe ? "כיסוי" : "Coverage"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <CoverageBar
            label={isHe ? "מקור · דוגמאות" : "Example provenance"}
            value={report.coverage.exampleSourceRef}
          />
          <CoverageBar
            label={isHe ? "מקור · מושגים" : "Concept provenance"}
            value={report.coverage.conceptSourceRef}
          />
          <CoverageBar
            label={isHe ? "מקור · נוסחאות" : "Formula provenance"}
            value={report.coverage.formulaSourceRef}
          />
          <CoverageBar
            label={isHe ? "בלוקים במצגת" : "Blocks in deck"}
            value={report.coverage.blocksWithDeck}
          />
          <CoverageBar
            label={isHe ? "בלוקים בתכנית" : "Blocks in plan"}
            value={report.coverage.blocksInPlan}
          />
        </div>
      </section>

      {/* Findings — errors first, then warns, then info */}
      <section className="mt-5">
        <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted">
          {isHe ? "ממצאים" : "Findings"}
        </h2>
        {(["error", "warn", "info"] as Severity[]).map((sev) =>
          grouped[sev].length ? (
            <div key={sev} className="mt-3">
              <h3 className={`mb-2 text-xs font-bold ${SEV_STYLES[sev].ink}`}>
                {SEV_STYLES[sev].label} · {grouped[sev].length}
              </h3>
              <ul className="m-0 grid list-none gap-2 p-0">
                {grouped[sev].map((f, i) => (
                  <FindingRow key={`${sev}-${i}`} f={f} />
                ))}
              </ul>
            </div>
          ) : null,
        )}
        {report.findings.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            {isHe ? "אין ממצאים." : "No findings."}
          </p>
        )}
      </section>
    </main>
  );
}
