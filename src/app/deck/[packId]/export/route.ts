import { getPack, listPacks } from "@/lib/coursepack/registry";
import { exportDeckHtml } from "@/lib/deck/exportHtml";

export function generateStaticParams() {
  return listPacks().map((p) => ({ packId: p.course.id }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ packId: string }> },
) {
  const { packId } = await params;
  const pack = getPack(packId);
  if (!pack) return new Response("Not found", { status: 404 });

  const html = exportDeckHtml(pack);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${packId}-deck.html"`,
    },
  });
}
