import { notFound } from "next/navigation";
import { getPack, listPacks } from "@/lib/coursepack/registry";
import { DeckViewer } from "@/components/deck/DeckViewer";

export function generateStaticParams() {
  return listPacks().map((p) => ({ packId: p.course.id }));
}

export default async function DeckPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = getPack(packId);
  if (!pack) notFound();
  return <DeckViewer pack={pack} />;
}
