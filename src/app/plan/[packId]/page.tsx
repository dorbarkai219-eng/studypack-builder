import { notFound } from "next/navigation";
import { getPack, listPacks } from "@/lib/coursepack/registry";
import { PlanView } from "@/components/plan/PlanView";

export function generateStaticParams() {
  return listPacks().map((p) => ({ packId: p.course.id }));
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = getPack(packId);
  if (!pack) notFound();
  return <PlanView pack={pack} />;
}
