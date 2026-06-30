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
      <div className="hero-band w-full max-w-md rounded-2xl border border-lines/60 p-6 text-center shadow-sm">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
          Class invite
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy">{cls.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {cls.members.length} member{cls.members.length === 1 ? "" : "s"} ·{" "}
          {cls.packIds.length} pack{cls.packIds.length === 1 ? "" : "s"} ·{" "}
          code <span className="font-mono font-bold text-orange">{cls.joinCode}</span>
        </p>
        <p className="mt-3 text-sm text-ink">
          Go to <Link href="/classes" className="font-semibold text-keyidea underline">
            /classes
          </Link>{" "}
          and paste the code into the join form to add yourself.
        </p>
        <p className="mt-2 text-xs text-muted">
          (Sign-in is required when auth is configured on the deployment.)
        </p>
      </div>
    </main>
  );
}
