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

export const SlideSchema = z.object({
  id: z.string(),
  blockId: z.string(),
  title: z.string(),
  kind: z.enum(["title", "toc", "concept", "formula", "example", "summary"]),
});
export type Slide = z.infer<typeof SlideSchema>;

export const DeckSchema = z.object({
  slides: z.array(SlideSchema).default([]),
});
export type Deck = z.infer<typeof DeckSchema>;

export const PlanTaskSchema = z.object({
  task: z.string(),
  done: z.boolean().default(false),
});
export type PlanTask = z.infer<typeof PlanTaskSchema>;

export const PlanDaySchema = z.object({
  day: z.number().int().positive(),
  phase: z.string(),
  star: z.boolean().default(false),
  /** Slide ids/titles in deck order (spec §3.7 plan↔deck alignment). */
  slideRefs: z.array(z.string()).default([]),
  learn: z.array(PlanTaskSchema).default([]),
  practice: z.array(PlanTaskSchema).default([]),
  goal: z.string(),
  materials: z.string().optional(),
});
export type PlanDay = z.infer<typeof PlanDaySchema>;

export const PlanSchema = z.object({
  days: z.array(PlanDaySchema).default([]),
});
export type Plan = z.infer<typeof PlanSchema>;

export const CoursePackSchema = z.object({
  course: CourseSchema,
  sources: z.array(SourceSchema).default([]),
  blocks: z.array(BlockSchema).default([]),
  summaries: SummariesSchema,
  deck: DeckSchema.default({ slides: [] }),
  plan: PlanSchema.default({ days: [] }),
});
export type CoursePack = z.infer<typeof CoursePackSchema>;

/** Parse + validate; throws on malformed data. Use at module load for mocks. */
export function parseCoursePack(data: unknown): CoursePack {
  return CoursePackSchema.parse(data);
}
