import { notFound } from "next/navigation";
import { getPack, listPacks } from "@/lib/coursepack/registry";
import { DeckViewer } from "@/components/deck/DeckViewer";

export async function generateStaticParams() {
  return (await listPacks()).map((p) => ({ packId: p.course.id }));
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
