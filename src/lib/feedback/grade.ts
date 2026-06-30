import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Block, PracticeItem, Rubric } from "@/lib/coursepack/schema";

/**
 * Pillar 4 — feedback grader (handoff §5 #9, §6 "feedback accuracy"):
 *
 * 1. The model is **forced** to call a `submit_feedback` tool whose
 *    input_schema is a Zod-derived JSON Schema. No prose-parsing risk.
 * 2. The output is a **diagnosis**, never just the answer — per-step
 *    ✓/✗ + why + fix, top trap acknowledged, three axes scored 0–10
 *    (approach / execution / interpretation), and a self-reported
 *    confidence in [0, 1].
 * 3. Reference solution (when available on the practice item) is the
 *    grading anchor — handoff: deterministic / reference-anchored
 *    grading beats free-running LLM judgement on a 4 vs 5 marginal.
 */

export const FeedbackStepSchema = z.object({
  status: z.enum(["correct", "partial", "wrong"]),
  what: z.string().describe("What the student did at this step (1 sentence)"),
  why: z
    .string()
    .describe("Why it's correct/partial/wrong — point to the principle, not just 'is right'"),
  fix: z
    .string()
    .optional()
    .describe("If status != correct: the minimal correction in plain language"),
});

export const FeedbackSchema = z.object({
  /** Per-step diagnosis (not just a final score). Empty if submission is unparseable. */
  steps: z.array(FeedbackStepSchema),
  /** Did the student fall into the rubric's top trap? */
  fellIntoTopTrap: z.boolean(),
  /** Bullet list of rubric `mustContain` items the student covered. */
  rubricCovered: z.array(z.string()),
  /** Bullet list of rubric `mustContain` items the student missed. */
  rubricMissed: z.array(z.string()),
  scores: z
    .object({
      approach: z.number().min(0).max(10),
      execution: z.number().min(0).max(10),
      interpretation: z.number().min(0).max(10),
    })
    .describe("Three-axis grade per spec §5 #9."),
  /** Two-line summary suitable for header display. */
  summary: z.string(),
  /** Model-reported confidence in this grading [0, 1]. Surface in UI. */
  confidence: z.number().min(0).max(1),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

const TOOL_NAME = "submit_feedback";
const DEFAULT_MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You are the Pillar-4 feedback tutor for StudyPack Builder.

You receive: (1) the topic block the student is practising, (2) a rubric that says what a full answer must contain + the top trap, (3) the practice question itself, (4) the reference solution (when available), (5) the student's submission.

Your job is to DIAGNOSE, not just answer. Walk through the student's submission step by step, mark each step correct / partial / wrong, explain WHY (point to the underlying principle), and give the MINIMAL fix in plain language when wrong. Then score the three axes (approach / execution / interpretation), each 0–10:

- Approach (0–10): did they pick the right method / formula / decomposition?
- Execution (0–10): did they apply it correctly (arithmetic, substitutions, units)?
- Interpretation (0–10): did they state what the result means + sanity-check it?

Be calibrated. A blank or off-topic submission gets low scores AND a low confidence value. A solid answer with one execution slip gets high approach + low-mid execution. If the rubric defines a top trap, explicitly note whether the student fell into it. Cover/miss the rubric "must contain" items by their literal text.

Critical: when a reference solution is provided, anchor execution scoring to it — don't second-guess the reference. If the reference is wrong on its face, lower your own confidence rather than the student's grade.

Respond by calling the submit_feedback tool exactly once with all required fields populated. Use the same language as the student's submission for the diagnosis. No prose outside the tool call.`;

export interface GradeInput {
  block: Pick<Block, "id" | "title" | "framing">;
  rubric: Rubric;
  item: Pick<PracticeItem, "id" | "title" | "prompt" | "referenceSolution">;
  submission: string;
  /** Output language for diagnosis (defaults to block language hint). */
  outputLanguage?: string;
}

export interface GradeOptions {
  client?: Anthropic;
  model?: string;
}

function buildTool(): Anthropic.Tool {
  const generated = zodToJsonSchema(FeedbackSchema, {
    name: "Feedback",
    $refStrategy: "none",
  }) as { definitions?: Record<string, unknown> };
  const inputSchema =
    (generated.definitions?.Feedback as unknown) ?? generated;
  return {
    name: TOOL_NAME,
    description:
      "Submit the structured per-step feedback + three-axis scores + confidence for the student's submission.",
    input_schema: inputSchema as Anthropic.Tool["input_schema"],
  };
}

export async function gradeSubmission(
  input: GradeInput,
  opts: GradeOptions = {},
): Promise<Feedback> {
  if (!input.submission.trim()) throw new Error("Empty submission");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const client = opts.client ?? (apiKey ? new Anthropic({ apiKey }) : null);
  if (!client) throw new Error("ANTHROPIC_API_KEY not set (or no client provided)");
  const model = opts.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const userBlocks: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: [
        `# Topic block`,
        `Title: ${input.block.title}`,
        `Framing: ${input.block.framing}`,
        ``,
        `# Rubric`,
        `Must contain:`,
        ...input.rubric.mustContain.map((m, i) => `${i + 1}. ${m}`),
        input.rubric.topTrap ? `\nTop trap to flag: ${input.rubric.topTrap}` : "",
        input.rubric.notes.length ? `\nNotes:\n- ${input.rubric.notes.join("\n- ")}` : "",
        ``,
        `# Practice item`,
        `Title: ${input.item.title}`,
        `Question: ${input.item.prompt}`,
        input.item.referenceSolution
          ? `\nReference solution (use as anchor):\n${input.item.referenceSolution}`
          : "",
        ``,
        `# Student submission`,
        input.submission,
        ``,
        input.outputLanguage
          ? `Reply in the student's language (${input.outputLanguage}).`
          : "Reply in the same language as the submission.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  const resp = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userBlocks }],
    tools: [buildTool()],
    tool_choice: { type: "tool", name: TOOL_NAME },
  });

  const toolUse = resp.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
  );
  if (!toolUse) throw new Error("Model did not call submit_feedback tool");
  return FeedbackSchema.parse(toolUse.input);
}
