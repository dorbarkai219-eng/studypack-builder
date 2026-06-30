import Link from "next/link";
import { IngestForm } from "@/components/ingest/IngestForm";

export default function IngestPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← בית
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-navy">העלאת חומרי קורס</h1>
      <p className="mt-1 text-sm text-muted">
        העלה קובצי PDF (סיכומי הרצאות, מבחנים, מצגות) ו/או הדבק טקסט. Claude
        מארגנת אותם לקובץ CoursePack — אותו מבנה שדף הנוסחאות, המצגת, התכנית
        והאימות צורכים.
      </p>
      <p className="mt-1 text-xs text-muted">
        דורש <code className="font-mono" dir="ltr">ANTHROPIC_API_KEY</code>{" "}
        במשתני סביבת השרת (אחרת תקבל 503).
      </p>
      <IngestForm />
    </main>
  );
}
