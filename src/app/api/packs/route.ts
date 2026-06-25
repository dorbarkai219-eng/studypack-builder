import { NextResponse } from "next/server";
import { listPacks } from "@/lib/coursepack/registry";

export const runtime = "nodejs";

/**
 * List every available CoursePack (mocks + ingested). Returns only the
 * stable identifying fields — not the full pack — so a client can build
 * an index / picker without paying for big payloads.
 */
export async function GET() {
  const packs = await listPacks();
  return NextResponse.json({
    packs: packs.map((p) => ({
      id: p.course.id,
      title: p.course.title,
      subject: p.course.subject,
      direction: p.course.direction,
      language: p.course.language,
      examDate: p.course.examDate,
      blockCount: p.blocks.length,
    })),
  });
}
