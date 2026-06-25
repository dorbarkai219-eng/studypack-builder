import { notFound } from "next/navigation";
import { getPack, listMockPackIds } from "@/lib/coursepack/registry";
import { PlanView } from "@/components/plan/PlanView";

export function generateStaticParams() {
  return listMockPackIds().map((id) => ({ packId: id }));
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = await getPack(packId);
  if (!pack) notFound();
  return <PlanView pack={pack} />;
}
