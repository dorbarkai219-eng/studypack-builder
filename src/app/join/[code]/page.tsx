import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassByCode } from "@/lib/classes/store";

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upper = code.toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(upper)) notFound();
  const cls = await getClassByCode(upper);
  if (!cls) notFound();

  return (
    <main className="grid min-h-dvh place-items-center bg-[#eef1f5] px-6">
      <div className="hero-band w-full max-w-md rounded-3xl border border-lines/60 p-6 text-center shadow-sm">
        <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">
          הזמנה לכיתה
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy">{cls.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {cls.members.length} חברים · {cls.packIds.length} ערכות · קוד{" "}
          <span className="font-mono font-bold text-orange" dir="ltr">
            {cls.joinCode}
          </span>
        </p>
        <p className="mt-3 text-sm text-ink">
          לחץ על{" "}
          <Link href="/classes" className="font-semibold text-keyidea underline">
            /classes
          </Link>{" "}
          והדבק את הקוד בטופס ההצטרפות כדי להוסיף את עצמך.
        </p>
        <p className="mt-2 text-xs text-muted">
          (התחברות נדרשת כשהוגדרה Auth בdeploy.)
        </p>
      </div>
    </main>
  );
}
