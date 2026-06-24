import { notFound } from "next/navigation";
import { getPack, listPacks } from "@/lib/coursepack/registry";
import { CheatSheetView } from "@/components/cheatsheet/CheatSheetView";

export function generateStaticParams() {
  return listPacks().map((p) => ({ packId: p.course.id }));
}

export default async function CheatSheetPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = getPack(packId);
  if (!pack) notFound();
  return <CheatSheetView pack={pack} />;
}
