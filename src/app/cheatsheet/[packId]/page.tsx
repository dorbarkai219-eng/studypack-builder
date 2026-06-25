import { notFound } from "next/navigation";
import { getPack, listMockPackIds } from "@/lib/coursepack/registry";
import { CheatSheetView } from "@/components/cheatsheet/CheatSheetView";

export function generateStaticParams() {
  return listMockPackIds().map((id) => ({ packId: id }));
}

export default async function CheatSheetPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = await getPack(packId);
  if (!pack) notFound();
  return <CheatSheetView pack={pack} />;
}
