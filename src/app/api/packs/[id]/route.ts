import { NextResponse } from "next/server";
import { deletePack, getStoredPack } from "@/lib/coursepack/store";

export const runtime = "nodejs";

/**
 * Pack CRUD endpoints. Mocks (hebrew-finance / english-biology) are
 * not deletable — only ingested packs in the store. GET returns the
 * raw CoursePack JSON, useful for round-tripping (export → re-import).
 */

const ID_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ID_RE.test(id))
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const pack = await getStoredPack(id);
  if (!pack) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(pack);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ID_RE.test(id))
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const ok = await deletePack(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
