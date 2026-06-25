import { getPack, listPacks } from "@/lib/coursepack/registry";
import { exportDeckPptx } from "@/lib/deck/exportPptx";

// pptxgenjs is Node-only (uses jszip + fs-style APIs) — force the Node runtime.
export const runtime = "nodejs";

export async function generateStaticParams() {
  return (await listPacks()).map((p) => ({ packId: p.course.id }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ packId: string }> },
) {
  const { packId } = await params;
  const pack = await getPack(packId);
  if (!pack) return new Response("Not found", { status: 404 });

  const buf = await exportDeckPptx(pack);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${packId}-deck.pptx"`,
    },
  });
}
