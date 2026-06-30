import Link from "next/link";
import { ClassesView } from "@/components/classes/ClassesView";

export default function ClassesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Home
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-navy">Classes</h1>
      <p className="mt-1 text-sm text-muted">
        Teachers publish a CoursePack to a class with a join code; students hop
        in with the code and inherit access to the pack&apos;s cheat sheet,
        deck, plan and practice modules.
      </p>
      <ClassesView />
    </main>
  );
}
