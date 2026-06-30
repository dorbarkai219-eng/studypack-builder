import Link from "next/link";
import { ClassesView } from "@/components/classes/ClassesView";

export default function ClassesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← בית
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-navy">כיתות</h1>
      <p className="mt-1 text-sm text-muted">
        מורים מפרסמים ערכת CoursePack לכיתה עם קוד הצטרפות; תלמידים מצטרפים עם
        הקוד ומקבלים גישה לדף הנוסחאות, המצגת, התכנית והתרגול של הערכה.
      </p>
      <ClassesView />
    </main>
  );
}
