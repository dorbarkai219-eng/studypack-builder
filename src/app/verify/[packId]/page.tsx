import { notFound } from "next/navigation";
import { getPack, listMockPackIds } from "@/lib/coursepack/registry";
import { VerifyView } from "@/components/verify/VerifyView";

export function generateStaticParams() {
  return listMockPackIds().map((id) => ({ packId: id }));
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = await getPack(packId);
  if (!pack) notFound();
  return <VerifyView pack={pack} />;
}
