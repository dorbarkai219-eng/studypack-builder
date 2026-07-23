import { notFound } from "next/navigation";
import { getPack, listMockPackIds } from "@/lib/coursepack/registry";
import { FlashcardsView } from "@/components/flashcards/FlashcardsView";

export function generateStaticParams() {
  return listMockPackIds().map((id) => ({ packId: id }));
}

export default async function FlashcardsPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = await getPack(packId);
  if (!pack) notFound();
  return <FlashcardsView pack={pack} />;
}
