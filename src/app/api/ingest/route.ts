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
import { getStoredPack, savePack } from "@/lib/coursepack/store";
import { checkRateLimit } from "@/lib/ingest/rateLimit";
import { getUserId } from "@/lib/auth/userId";

// Anthropic SDK + filesystem persistence require Node.
export const runtime = "nodejs";
// 5-minute timeout (Vercel Hobby cap is 300s; raise on Pro if needed).
export const maxDuration = 300;

const ID_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Total upload size cap. PDF base64 ~33% larger; Anthropic message size + cost both grow fast. */
const MAX_BYTES_PER_REQUEST = 25 * 1024 * 1024;
const MAX_BYTES_PER_FILE = 15 * 1024 * 1024;
const MAX_FILES = 8;

export async function POST(req: Request) {
  // Auth: middleware already gates this route, but the API can also be
  // hit directly; require a user id here so the store key is never
  // empty / cross-user.
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  // Rate-limit per user (or per IP when auth is off and userId is the dev sentinel).
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const limit = checkRateLimit(`ingest:${userId}:${ip}`);
  if (!limit.ok)
    return NextResponse.json(
      {
        error: `Rate limited — retry in ${limit.retryAfterSeconds}s`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
        },
      },
    );

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

  // Idempotency — bail before doing expensive work if the id is already taken.
  // Caller can opt in to overwrite with overwrite=true.
  const overwrite = String(form.get("overwrite") ?? "").toLowerCase() === "true";
  if (!overwrite) {
    const existing = await getStoredPack(userId, id);
    if (existing)
      return NextResponse.json(
        {
          error: `Pack "${id}" already exists — re-submit with overwrite=true to replace it`,
        },
        { status: 409 },
      );
  }

  const files: IngestFile[] = [];
  let totalBytes = 0;
  for (const entry of form.getAll("files")) {
    if (!(entry instanceof File)) continue;
    if (files.length >= MAX_FILES)
      return NextResponse.json(
        { error: `Too many files (max ${MAX_FILES} per ingest)` },
        { status: 413 },
      );
    if (entry.size > MAX_BYTES_PER_FILE)
      return NextResponse.json(
        {
          error: `File "${entry.name}" is ${(entry.size / 1024 / 1024).toFixed(1)} MB — max ${MAX_BYTES_PER_FILE / 1024 / 1024} MB per file`,
        },
        { status: 413 },
      );
    totalBytes += entry.size;
    if (totalBytes > MAX_BYTES_PER_REQUEST)
      return NextResponse.json(
        {
          error: `Combined upload is ${(totalBytes / 1024 / 1024).toFixed(1)} MB — max ${MAX_BYTES_PER_REQUEST / 1024 / 1024} MB per ingest`,
        },
        { status: 413 },
      );
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
    await savePack(userId, pack);
    return NextResponse.json({ ok: true, id: pack.course.id });
  } catch (err) {
    // Log the real error server-side; return a friendly, generic message so
    // internal detail never leaks and a missing AI key degrades gracefully.
    console.error("[ingest/structure] failed:", err);
    const raw = err instanceof Error ? err.message : "";
    const isKeyIssue = /ANTHROPIC_API_KEY/.test(raw);
    return NextResponse.json(
      {
        error: isKeyIssue
          ? "פיצ'ר ייבוא החומר אינו זמין כרגע (חסר מפתח AI). אפשר להשתמש בערכות הקיימות."
          : "עיבוד החומר נכשל, נסה שוב.",
      },
      { status: isKeyIssue ? 503 : 500 },
    );
  }
}
