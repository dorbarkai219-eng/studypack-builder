import { notFound } from "next/navigation";
import { getPack, listMockPackIds } from "@/lib/coursepack/registry";
import { DeckViewer } from "@/components/deck/DeckViewer";

export function generateStaticParams() {
  return listMockPackIds().map((id) => ({ packId: id }));
}

export default async function DeckPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = await getPack(packId);
  if (!pack) notFound();
  return <DeckViewer pack={pack} />;
}
