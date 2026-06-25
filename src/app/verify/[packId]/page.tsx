import { notFound } from "next/navigation";
import { getPack, listPacks } from "@/lib/coursepack/registry";
import { VerifyView } from "@/components/verify/VerifyView";

export function generateStaticParams() {
  return listPacks().map((p) => ({ packId: p.course.id }));
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = getPack(packId);
  if (!pack) notFound();
  return <VerifyView pack={pack} />;
}
