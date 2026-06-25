import { NextResponse } from "next/server";
import { deletePack, getStoredPack } from "@/lib/coursepack/store";
import { getUserId } from "@/lib/auth/userId";

export const runtime = "nodejs";

const ID_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;

async function requireUserId(): Promise<{ userId: string } | { error: Response }> {
  try {
    return { userId: await getUserId() };
  } catch {
    return {
      error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    };
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  if (!ID_RE.test(id))
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const pack = await getStoredPack(auth.userId, id);
  if (!pack) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(pack);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  if (!ID_RE.test(id))
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const ok = await deletePack(auth.userId, id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
