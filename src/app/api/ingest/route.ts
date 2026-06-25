import { NextResponse } from "next/server";
import {
  structureCoursePack,
  type IngestFile,
  type IngestMeta,
} from "@/lib/ingest/structure";
import {
  detectKind,
  extractDocxText,
  extractPptxText,
} from "@/lib/ingest/extract";
import { savePack } from "@/lib/coursepack/store";

// Anthropic SDK + filesystem persistence require Node.
export const runtime = "nodejs";
// 6-minute timeout — large PDFs + 16k completion can be slow.
export const maxDuration = 360;

const ID_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const id = String(form.get("id") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const subject = String(form.get("subject") ?? "").trim();
  const language = String(form.get("language") ?? "").trim();
  const direction = String(form.get("direction") ?? "").trim() as "ltr" | "rtl";
  const outputLanguage =
    String(form.get("outputLanguage") ?? language).trim() || language;
  const examDate = String(form.get("examDate") ?? "").trim();
  const weakTopicsRaw = String(form.get("weakTopics") ?? "").trim();
  const weakTopics = weakTopicsRaw
    ? weakTopicsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (!ID_RE.test(id))
    return NextResponse.json(
      { error: "id must be lowercase letters/digits/dashes (2-41 chars)" },
      { status: 400 },
    );
  if (!title || !subject || !language)
    return NextResponse.json(
      { error: "title, subject and language are required" },
      { status: 400 },
    );
  if (direction !== "ltr" && direction !== "rtl")
    return NextResponse.json({ error: "direction must be ltr or rtl" }, { status: 400 });
  if (!DATE_RE.test(examDate))
    return NextResponse.json({ error: "examDate must be YYYY-MM-DD" }, { status: 400 });

  const files: IngestFile[] = [];
  for (const entry of form.getAll("files")) {
    if (!(entry instanceof File)) continue;
    const buf = Buffer.from(await entry.arrayBuffer());
    const kind = detectKind(entry.name, entry.type);
    if (kind === "pdf") {
      files.push({ filename: entry.name, type: "pdf", data: buf });
    } else if (kind === "pptx" || kind === "docx") {
      try {
        const text =
          kind === "pptx" ? await extractPptxText(buf) : await extractDocxText(buf);
        files.push({
          filename: entry.name,
          type: "text",
          data: Buffer.from(text, "utf8"),
        });
      } catch (err) {
        return NextResponse.json(
          {
            error: `Failed to extract ${kind.toUpperCase()} "${entry.name}": ${
              err instanceof Error ? err.message : String(err)
            }`,
          },
          { status: 400 },
        );
      }
    } else {
      files.push({ filename: entry.name, type: "text", data: buf });
    }
  }
  // Allow a "text" textarea fallback when no file upload is convenient (demo / no API key needed-flow).
  const rawText = String(form.get("text") ?? "").trim();
  if (rawText)
    files.push({
      filename: "pasted.txt",
      type: "text",
      data: Buffer.from(rawText, "utf8"),
    });

  if (!files.length)
    return NextResponse.json({ error: "Upload at least one file or paste text" }, { status: 400 });

  const meta: IngestMeta = {
    id,
    title,
    subject,
    language,
    direction,
    outputLanguage,
    examDate,
    weakTopics,
  };

  try {
    const pack = await structureCoursePack(files, meta);
    await savePack(pack);
    return NextResponse.json({ ok: true, id: pack.course.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Structuring failed";
    const code = /ANTHROPIC_API_KEY/.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status: code });
  }
}
