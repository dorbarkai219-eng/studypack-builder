import Link from "next/link";
import { IngestForm } from "@/components/ingest/IngestForm";

export default function IngestPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Home
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-navy">Ingest course materials</h1>
      <p className="mt-1 text-sm text-muted">
        Upload PDFs (lecture notes, past exams, slides) and/or paste text. Claude
        structures them into a CoursePack JSON — the same shape the cheat sheet,
        deck, plan and verify pages consume (spec §4.1, §7).
      </p>
      <p className="mt-1 text-xs text-muted">
        Requires <code className="font-mono">ANTHROPIC_API_KEY</code> in the
        server env.
      </p>
      <IngestForm />
    </main>
  );
}
