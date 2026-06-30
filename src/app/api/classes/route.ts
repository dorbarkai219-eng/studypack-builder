import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/userId";
import { listMockPackIds } from "@/lib/coursepack/registry";
import {
  listClassesOwnedBy,
  listClassesMemberOf,
  saveClass,
} from "@/lib/classes/store";
import { makeJoinCode } from "@/lib/classes/schema";

export const runtime = "nodejs";

const CreateSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,40}$/),
  name: z.string().min(1).max(80),
  packIds: z.array(z.string()).max(50).default([]),
});

export async function GET() {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const [owned, member] = await Promise.all([
    listClassesOwnedBy(userId),
    listClassesMemberOf(userId),
  ]);
  return NextResponse.json({ owned, member });
}

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );

  // Only allow publishing packs the caller already has access to (mock
  // packs are public; user-scoped ingested packs would require a more
  // involved check — deferred until that surface exists).
  const allowedPackIds = new Set(listMockPackIds());
  const packIds = parsed.data.packIds.filter((p) => allowedPackIds.has(p));

  const cls = {
    id: parsed.data.id,
    name: parsed.data.name,
    ownerId: userId,
    packIds,
    joinCode: makeJoinCode(),
    members: [],
    createdAt: new Date().toISOString(),
  };

  try {
    await saveClass(cls);
    return NextResponse.json({ ok: true, class: cls });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "save failed" },
      { status: 500 },
    );
  }
}
