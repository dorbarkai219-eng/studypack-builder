import { z } from "zod";

/**
 * CoursePack — the single source of truth for all three artifacts
 * (cheat sheet, deck, study plan). Mirrors spec §9.
 *
 * Keep this STRICT: mock + (later) LLM-generated data is validated against it
 * so a malformed pack fails loudly instead of rendering corrupted output.
 */

export const Direction = z.enum(["ltr", "rtl"]);
export type Direction = z.infer<typeof Direction>;

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  /** BCP-47-ish language tag of the source material, e.g. "he", "en". */
  language: z.string(),
  direction: Direction,
  /** ISO date YYYY-MM-DD. */
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weakTopics: z.array(z.string()).default([]),
  /** Output language of the artifacts; may differ from UI language (spec §6). */
  outputLanguage: z.string(),
});
export type Course = z.infer<typeof CourseSchema>;

export const SourceSchema = z.object({
  id: z.string(),
  filename: z.string(),
  type: z.enum(["pdf", "pptx", "docx", "image", "text"]),
  pages: z.number().int().nonnegative().default(0),
});
export type Source = z.infer<typeof SourceSchema>;

export const ConceptSchema = z.object({
  term: z.string(),
  /** Optional transliterated / English term (spec §4.3 mixed titles). */
  enTerm: z.string().optional(),
  /** Plain-language: what it means, why, when to use (spec §3.3). */
  explanation: z.string(),
  /** Provenance — which source/page this concept came from (spec §7). */
  sourceRef: z.string().optional(),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const TermKeyEntrySchema = z.object({
  symbol: z.string(),
  meaning: z.string(),
});
export type TermKeyEntry = z.infer<typeof TermKeyEntrySchema>;

export const FormulaSchema = z.object({
  /** Plain text or LaTeX-ish; ALWAYS rendered LTR even on an RTL page (spec §6). */
  latexOrText: z.string(),
  /** One-line intuition, not the symbols (spec §3.3). */
  intuition: z.string(),
  /** Per-box symbol key so the reader never leaves the box (spec §3.4). */
  termKey: z.array(TermKeyEntrySchema).default([]),
  /** Provenance — which source/page this formula came from (spec §7). */
  sourceRef: z.string().optional(),
});
export type Formula = z.infer<typeof FormulaSchema>;

export const ExampleSchema = z.object({
  text: z.string(),
  /** Provenance — which source/page this came from (spec §7). */
  sourceRef: z.string().optional(),
});
export type Example = z.infer<typeof ExampleSchema>;

export const StarLevel = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);
export type StarLevel = z.infer<typeof StarLevel>;

/**
 * Per-block rubric for Pillar 4 (practice + feedback). Drives the AI
 * tutor: what a full answer must contain, the top trap to avoid, and
 * the 3-axis scoring spine (approach / execution / interpretation).
 * Spec §5 #9 + handoff "feedback diagnoses, never just answers".
 */
export const RubricSchema = z.object({
  /** Bullet list of must-have steps/items in a full answer. */
  mustContain: z.array(z.string()).default([]),
  /** The single highest-leverage trap to flag. */
  topTrap: z.string().optional(),
  /** Optional explanatory hints / methodological notes. */
  notes: z.array(z.string()).default([]),
});
export type Rubric = z.infer<typeof RubricSchema>;

/**
 * A practice item the student can attempt — usually an exam question
 * or exercise — with an optional reference solution to grade against
 * (handoff: deterministic grading > pure LLM judgement).
 */
export const PracticeItemSchema = z.object({
  id: z.string(),
  /** Display title (e.g. "Question 4, 2024 mock exam"). */
  title: z.string(),
  /** Full question text. */
  prompt: z.string(),
  /** Optional reference solution / answer key for grading. */
  referenceSolution: z.string().optional(),
  /** Provenance — which source/page this came from. */
  sourceRef: z.string().optional(),
});
export type PracticeItem = z.infer<typeof PracticeItemSchema>;

export const BlockSchema = z.object({
  id: z.string(),
  title: z.string(),
  enTitle: z.string().optional(),
  order: z.number().int(),
  /** 0 = normal, 1 = ★ high-frequency, 2 = ★★ heavy exam topic (spec §3.2). */
  starLevel: StarLevel.default(0),
  /** e.g. "Question 4" — which exam question this maps to (spec §3.2). */
  examMapping: z.string().optional(),
  /** One-line "why it matters" framing (spec §3.2). */
  framing: z.string(),
  concepts: z.array(ConceptSchema).default([]),
  formulas: z.array(FormulaSchema).default([]),
  examples: z.array(ExampleSchema).default([]),
  mistakes: z.array(z.string()).default([]),
  tips: z.array(z.string()).default([]),
  /** Pillar 4: rubric the tutor grades a submission against. */
  rubric: RubricSchema.optional(),
  /** Pillar 4: exam questions / exercises the student practices for this block. */
  practiceItems: z.array(PracticeItemSchema).default([]),
});
export type Block = z.infer<typeof BlockSchema>;

export const ConfusingPairSchema = z.object({
  title: z.string(),
  left: z.string(),
  right: z.string(),
  whenLeft: z.string(),
  whenRight: z.string(),
});
export type ConfusingPair = z.infer<typeof ConfusingPairSchema>;

export const TypicalValueSchema = z.object({
  param: z.string(),
  range: z.string(),
  note: z.string().optional(),
});
export type TypicalValue = z.infer<typeof TypicalValueSchema>;

export const SummariesSchema = z.object({
  confusingPairs: z.array(ConfusingPairSchema).default([]),
  criticalConcepts: z.array(z.string()).default([]),
  traps: z.array(z.string()).default([]),
  typicalValues: z.array(TypicalValueSchema).default([]),
  checklist: z.array(z.string()).default([]),
});
export type Summaries = z.infer<typeof SummariesSchema>;

/**
 * NOTE: deck STRUCTURE (slide list) and plan STRUCTURE (study days) are
 * NOT persisted on the CoursePack — they are derived fresh on every render
 * via `buildDeck(pack)` and `buildPlan(pack, totalDays)`. Their TypeScript
 * types live next to the builders (`src/lib/deck/types.ts`,
 * `src/lib/plan/types.ts`) so they can never drift from the source of
 * truth. Zod's default object behaviour silently strips any extra `deck`
 * or `plan` keys on legacy persisted data — no migration needed.
 */
export const CoursePackSchema = z.object({
  course: CourseSchema,
  sources: z.array(SourceSchema).default([]),
  blocks: z.array(BlockSchema).default([]),
  summaries: SummariesSchema,
});
export type CoursePack = z.infer<typeof CoursePackSchema>;

/** Parse + validate; throws on malformed data. Use at module load for mocks. */
export function parseCoursePack(data: unknown): CoursePack {
  return CoursePackSchema.parse(data);
}
