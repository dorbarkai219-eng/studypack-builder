import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/userId";
import { getClassByCode, saveClass } from "@/lib/classes/store";

export const runtime = "nodejs";

const JoinSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{6}$/),
  label: z.string().max(80).optional(),
});

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
  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );

  const cls = await getClassByCode(parsed.data.code);
  if (!cls)
    return NextResponse.json({ error: "Invalid join code" }, { status: 404 });

  if (cls.ownerId === userId)
    return NextResponse.json(
      { error: "You own this class — no need to join" },
      { status: 409 },
    );
  if (cls.members.some((m) => m.userId === userId))
    return NextResponse.json({ ok: true, class: cls, alreadyMember: true });

  const next = {
    ...cls,
    members: [
      ...cls.members,
      {
        userId,
        label: parsed.data.label,
        joinedAt: new Date().toISOString(),
      },
    ],
  };
  await saveClass(next);
  return NextResponse.json({ ok: true, class: next });
}
