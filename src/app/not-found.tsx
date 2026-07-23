import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="hero-band w-full max-w-md rounded-3xl border border-lines/60 p-8 text-center shadow-sm">
        <p className="m-0 font-mono text-6xl font-bold text-navy" dir="ltr">
          404
        </p>
        <h1 className="mt-3 text-xl font-bold text-ink">הדף לא נמצא</h1>
        <p className="mt-2 text-sm text-muted">
          הדף שניסית לפתוח לא קיים, או שמזהה הערכה לא ידוע.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-paper hover:brightness-110"
          >
            חזרה לבית
          </Link>
          <Link
            href="/ingest"
            className="rounded-md border border-lines px-4 py-2 text-sm text-ink hover:bg-lines/40"
          >
            + העלה חומרי קורס
          </Link>
        </div>
      </div>
    </main>
  );
}
