import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="hero-band nb-card w-full max-w-md p-8 text-center">
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
            className="nb-btn nb-btn-primary px-4 py-2 text-sm"
          >
            חזרה לבית
          </Link>
          <Link
            href="/ingest"
            className="nb-btn px-4 py-2 text-sm"
          >
            + העלה חומרי קורס
          </Link>
        </div>
      </div>
    </main>
  );
}
