import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  BlockSchema,
  SummariesSchema,
  parseCoursePack,
  type CoursePack,
  type Source,
} from "@/lib/coursepack/schema";

/**
 * Ingestion → CoursePack structuring (spec §4.1).
 *
 * Takes raw uploaded materials + user-provided course metadata and asks
 * Claude to structure them into a CoursePack JSON. The schema is the
 * single source of truth — the returned JSON is validated via Zod and a
 * malformed response raises rather than rendering corrupted artifacts.
 *
 * PDF files are forwarded as native `document` blocks (Claude reads
 * them directly, no local pdf-parse). Plain text is inlined.
 */

export type IngestFileType = "pdf" | "text";

export interface IngestFile {
  filename: string;
  type: IngestFileType;
  /** PDF binary OR utf-8 text bytes (depending on type). */
  data: Buffer;
}

export interface IngestMeta {
  /** Stable id used as the URL slug. Must be unique. */
  id: string;
  title: string;
  subject: string;
  /** BCP-47-ish, e.g. "he", "en". */
  language: string;
  direction: "ltr" | "rtl";
  /** Output language of the artifacts (may differ from `language`). */
  outputLanguage: string;
  /** ISO YYYY-MM-DD. */
  examDate: string;
  weakTopics?: string[];
}

export interface StructureOptions {
  client?: Anthropic;
  model?: string;
  /** Override max_tokens (default 16k — CoursePack JSON can be large). */
  maxTokens?: number;
}

const DEFAULT_MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You are a course-pack structurer for the StudyPack Builder.

You receive raw course materials (PDF documents and/or transcribed text) plus user-provided course metadata. Your job is to extract the material into a STRICT JSON object matching the CoursePack schema below. Return ONLY the JSON object — no prose, no markdown fences.

Spec rules you MUST follow (anti-hallucination, spec §3/§7):
- Every concept, formula, example, mistake, and tip must be derivable from the supplied materials. Do NOT invent facts. If a section has nothing supported, leave the array empty.
- Blocks are coherent topic groups (spec §3.2). Order them in the natural learning order. Each block has a one-line "framing" — why it matters.
- "explanation" fields are plain language, not bullet symbols (spec §3.3).
- Every formula has a "termKey" — symbol → meaning entries — so the reader never has to leave the box (spec §3.4).
- Every concept, formula AND example carries a "sourceRef" pointing to the source id (e.g. "src1 p. 12") wherever it can be cited. If a claim genuinely has no traceable source in the materials, omit the field — but never invent.
- Mark high-frequency / heavy exam topics with starLevel 1 or 2.
- Summaries (confusingPairs, criticalConcepts, traps, typicalValues, checklist) span all blocks; populate from material when possible.

Schema (Zod-checked; missing required fields → REJECTED):
{
  "course": { /* will be overwritten by the host — emit a placeholder object */ "id":"_", "title":"_", "subject":"_", "language":"_", "direction":"ltr", "examDate":"2000-01-01", "weakTopics":[], "outputLanguage":"_" },
  "sources": [ /* will be overwritten by host — emit empty array */ ],
  "blocks": [{
    "id": "kebab-or-short-id",
    "title": "string (in outputLanguage)",
    "enTitle": "string (optional — transliteration / English term)",
    "order": 1,
    "starLevel": 0|1|2,
    "examMapping": "string (optional)",
    "framing": "one-line why-it-matters in outputLanguage",
    "concepts": [{ "term":"...", "enTerm":"...", "explanation":"plain-language explanation", "sourceRef":"src1 p. 7" }],
    "formulas": [{ "latexOrText":"LTR-safe formula string", "intuition":"...", "termKey":[{"symbol":"x","meaning":"..."}], "sourceRef":"src1 p. 11" }],
    "examples": [{ "text":"...", "sourceRef":"src1 p. 12" }],
    "mistakes": ["common error 1", "..."],
    "tips": ["exam tip 1", "..."]
  }],
  "summaries": {
    "confusingPairs": [{ "title":"...", "left":"formula L", "right":"formula R", "whenLeft":"...", "whenRight":"..." }],
    "criticalConcepts": ["..."],
    "traps": ["..."],
    "typicalValues": [{ "param":"...", "range":"...", "note":"..." }],
    "checklist": ["pre-submission item", "..."]
  }
}

Output language: all user-facing text (titles, explanations, framings, summaries) MUST be in the requested outputLanguage. Formula strings remain ASCII/Latin/Greek (rendered LTR-isolated by the renderer per spec §6).`;

function userInstructions(meta: IngestMeta): string {
  return [
    `Course metadata:`,
    `- id: ${meta.id}`,
    `- title: ${meta.title}`,
    `- subject: ${meta.subject}`,
    `- language (source): ${meta.language}`,
    `- direction: ${meta.direction}`,
    `- outputLanguage (use for ALL user-facing text): ${meta.outputLanguage}`,
    `- examDate: ${meta.examDate}`,
    meta.weakTopics?.length ? `- weakTopics: ${meta.weakTopics.join(", ")}` : "",
    ``,
    `Structure the uploaded materials into a CoursePack JSON as specified. Return the JSON object ONLY.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Strip ```json fences / surrounding prose, parse the first JSON object found. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Strip code fences if present.
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const body = fence ? fence[1] : trimmed;
  const start = body.indexOf("{");
  if (start < 0) throw new Error("No JSON object found in model response");
  // Walk braces respecting strings.
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error("Unterminated JSON object in model response");
  return JSON.parse(body.slice(start, end + 1));
}

function filesToSources(files: IngestFile[]): Source[] {
  return files.map((f, i) => ({
    id: `src${i + 1}`,
    filename: f.filename,
    type: f.type === "pdf" ? "pdf" : "text",
    pages: 0,
    // We persist the original kind even after extracting to text so the
    // verify pass can audit provenance against the real format.
  }));
}

/** Maps "pptx"/"docx" → "text" for the LLM block path. */
export type ExtractedKind = "pdf" | "text";

/**
 * The portion of CoursePack the model is responsible for. Course +
 * sources are host-controlled and merged in after extraction, so we
 * don't waste prompt tokens (or trust budget) on them.
 */
const ModelOutputSchema = z.object({
  blocks: z.array(BlockSchema),
  summaries: SummariesSchema,
});

const TOOL_NAME = "submit_course_pack";

/**
 * Build the Anthropic tool definition. Returns the same shape every
 * call — pure, deterministic. We inline refs so the tool input_schema
 * is a single object (Anthropic accepts JSON Schema draft-07).
 */
function buildSubmitTool(): Anthropic.Tool {
  // zodToJsonSchema returns either a wrapper { $ref, definitions } or a
  // bare schema depending on options. We name the root and then unwrap.
  const generated = zodToJsonSchema(ModelOutputSchema, {
    name: "CoursePackContent",
    $refStrategy: "none",
  }) as { definitions?: Record<string, unknown> };
  const inputSchema =
    (generated.definitions?.CoursePackContent as unknown) ?? generated;
  return {
    name: TOOL_NAME,
    description:
      "Submit the structured CoursePack content (blocks + summaries) extracted from the uploaded materials. Call this exactly once with all fields populated.",
    input_schema: inputSchema as Anthropic.Tool["input_schema"],
  };
}

export async function structureCoursePack(
  files: IngestFile[],
  meta: IngestMeta,
  opts: StructureOptions = {},
): Promise<CoursePack> {
  if (!files.length) throw new Error("No source files supplied");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const client = opts.client ?? (apiKey ? new Anthropic({ apiKey }) : null);
  if (!client) throw new Error("ANTHROPIC_API_KEY not set (or no client provided)");
  const model = opts.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const content: Anthropic.ContentBlockParam[] = [];
  for (const f of files) {
    if (f.type === "pdf") {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: f.data.toString("base64"),
        },
        title: f.filename,
      });
    } else {
      content.push({
        type: "text",
        text: `### Source: ${f.filename}\n\n${f.data.toString("utf8")}`,
      });
    }
  }
  content.push({ type: "text", text: userInstructions(meta) });

  const tool = buildSubmitTool();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content }];
  const maxAttempts = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const resp = await client.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 16_000,
      system: SYSTEM_PROMPT,
      messages,
      tools: [tool],
      // Force the tool — eliminates "model emitted prose instead of JSON".
      tool_choice: { type: "tool", name: TOOL_NAME },
    });
    // Tool input is the structured object — no regex parsing needed.
    const toolUse = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
    );
    // Fallback: some older models or refusals still emit a text block
    // with JSON. extractJson handles fences + brace walking.
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    try {
      const raw = (toolUse?.input ?? (text.trim() ? extractJson(text) : {})) as Record<
        string,
        unknown
      >;
      // Overwrite course + sources with host-controlled values so Claude
      // can't accidentally rename the pack or invent provenance ids.
      const candidate = {
        ...raw,
        course: {
          id: meta.id,
          title: meta.title,
          subject: meta.subject,
          language: meta.language,
          direction: meta.direction,
          examDate: meta.examDate,
          weakTopics: meta.weakTopics ?? [],
          outputLanguage: meta.outputLanguage,
        },
        sources: filesToSources(files),
      };
      return parseCoursePack(candidate);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === maxAttempts) break;
      // Hand the model its previous output + a corrective instruction.
      messages.push(
        { role: "assistant", content: resp.content },
        {
          role: "user",
          content: toolUse
            ? [
                {
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  is_error: true,
                  content: `Validation failed: ${lastError.message.slice(0, 240)}. Re-call ${TOOL_NAME} with corrected fields.`,
                },
              ]
            : `Your previous response could not be parsed: ${lastError.message.slice(0, 240)}. Call the ${TOOL_NAME} tool with the structured content.`,
        },
      );
    }
  }
  throw new Error(
    `Structuring failed after ${maxAttempts} attempt(s): ${lastError?.message ?? "unknown"}`,
  );
}
