import type { CoursePack } from "@/lib/coursepack/schema";
import { buildDeck } from "@/lib/deck/buildDeck";
import { buildPlan } from "@/lib/plan/buildPlan";
import { daysUntil } from "@/lib/date";

/**
 * Verify / diff pass (spec §7 anti-hallucination): walk a CoursePack and the
 * artifacts derived from it, surface every claim that lacks provenance, every
 * structural gap, every cross-artifact misalignment, and every place a Hebrew
 * RTL pack risks corrupting Latin/formula text.
 *
 * Pure, deterministic. No network, no Date / random.
 */

export type Severity = "error" | "warn" | "info";

export interface Finding {
  severity: Severity;
  code: string;
  message: string;
  /** Optional human-readable path to the offending field (e.g. "blocks[2].formulas[0]"). */
  where?: string;
}

export interface VerifyCoverage {
  /** Fraction (0..1) of examples that carry a sourceRef. */
  exampleSourceRef: number;
  /** Fraction of concepts that carry a sourceRef. */
  conceptSourceRef: number;
  /** Fraction of formulas that carry a sourceRef. */
  formulaSourceRef: number;
  /** Fraction of blocks that produce ≥1 deck slide. */
  blocksWithDeck: number;
  /** Fraction of blocks referenced (transitively) by ≥1 plan day. */
  blocksInPlan: number;
}

export interface VerifyReport {
  packId: string;
  findings: Finding[];
  counts: { error: number; warn: number; info: number };
  coverage: VerifyCoverage;
}

/** Hebrew code-point range (covers most Hebrew letters and punctuation). */
const HEBREW_RE = /[֐-׿יִ-ﭏ]/;
const SOURCE_TOKEN_RE = /\bsrc\d+\b/g;

export function verifyPack(pack: CoursePack): VerifyReport {
  const findings: Finding[] = [];
  const add = (
    severity: Severity,
    code: string,
    message: string,
    where?: string,
  ) => findings.push({ severity, code, message, where });

  // ----- Top-level / course -----
  if (!pack.blocks.length) add("error", "no_blocks", "Pack has zero blocks", "blocks");
  if (!pack.sources.length)
    add("warn", "no_sources", "Pack declares no sources — every claim is unprovenanced", "sources");

  const days = daysUntil(pack.course.examDate);
  if (days < 0)
    add("warn", "exam_past", `Exam date ${pack.course.examDate} is in the past`, "course.examDate");
  add("info", "exam_in", `Exam in ${Math.max(0, days)} days`, "course.examDate");

  const sourceIds = new Set(pack.sources.map((s) => s.id));

  // ----- Per-block structural + provenance checks -----
  let totalExamples = 0;
  let examplesWithRef = 0;
  let totalConcepts = 0;
  let conceptsWithRef = 0;
  let totalFormulas = 0;
  let formulasWithRef = 0;
  const blockHasContent = new Map<string, boolean>();
  const blockHasExampleSource = new Map<string, boolean>();

  const checkSourceTokens = (
    ref: string,
    code: string,
    where: string,
  ) => {
    const tokens = ref.match(SOURCE_TOKEN_RE) ?? [];
    for (const tok of tokens) {
      if (!sourceIds.has(tok))
        add(
          "error",
          "unknown_source_id",
          `${code} sourceRef references "${tok}" but no such source declared`,
          where,
        );
    }
  };

  pack.blocks.forEach((b, bi) => {
    const where = `blocks[${bi}](${b.id})`;
    const hasContent = b.concepts.length > 0 || b.formulas.length > 0;
    blockHasContent.set(b.id, hasContent);
    if (!hasContent)
      add("error", "block_empty", `Block "${b.title}" has no concepts and no formulas`, where);
    if (!b.framing.trim())
      add("warn", "block_no_framing", `Block "${b.title}" has no framing line (spec §3.2)`, where);

    b.concepts.forEach((c, ci) => {
      totalConcepts++;
      if (!c.explanation.trim())
        add(
          "error",
          "concept_no_explanation",
          `Concept "${c.term}" has empty explanation (spec §3.3 explain-don't-bullet)`,
          `${where}.concepts[${ci}]`,
        );
      if (c.sourceRef && c.sourceRef.trim()) {
        conceptsWithRef++;
        checkSourceTokens(
          c.sourceRef,
          "Concept",
          `${where}.concepts[${ci}].sourceRef`,
        );
      } else {
        add(
          "warn",
          "concept_no_provenance",
          `Concept "${c.term}" has no sourceRef — claim not traceable (spec §7)`,
          `${where}.concepts[${ci}]`,
        );
      }
    });

    b.formulas.forEach((f, fi) => {
      totalFormulas++;
      if (!f.intuition.trim())
        add(
          "warn",
          "formula_no_intuition",
          `Formula "${f.latexOrText}" has no plain-language intuition (spec §3.3)`,
          `${where}.formulas[${fi}]`,
        );
      if (!f.termKey.length)
        add(
          "warn",
          "formula_no_term_key",
          `Formula "${f.latexOrText}" has no term key — reader has to leave the box (spec §3.4)`,
          `${where}.formulas[${fi}]`,
        );
      // RTL contract: a formula on an RTL pack should be Latin/Greek/math —
      // Hebrew chars here usually mean a label that should be in `intuition`,
      // and risks the spec's #1 RTL-formula-corruption bug.
      if (pack.course.direction === "rtl" && HEBREW_RE.test(f.latexOrText))
        add(
          "warn",
          "formula_has_hebrew",
          `Formula "${f.latexOrText}" contains Hebrew on an RTL pack — risks LTR-isolation corruption (spec §6)`,
          `${where}.formulas[${fi}]`,
        );
      if (f.sourceRef && f.sourceRef.trim()) {
        formulasWithRef++;
        checkSourceTokens(
          f.sourceRef,
          "Formula",
          `${where}.formulas[${fi}].sourceRef`,
        );
      } else {
        add(
          "warn",
          "formula_no_provenance",
          `Formula "${f.latexOrText}" has no sourceRef — claim not traceable (spec §7)`,
          `${where}.formulas[${fi}]`,
        );
      }
    });

    let blockHasSrc = false;
    b.examples.forEach((e, ei) => {
      totalExamples++;
      if (e.sourceRef && e.sourceRef.trim()) {
        examplesWithRef++;
        blockHasSrc = true;
        checkSourceTokens(
          e.sourceRef,
          "Example",
          `${where}.examples[${ei}].sourceRef`,
        );
      } else {
        add(
          "warn",
          "example_no_provenance",
          `Example in "${b.title}" has no sourceRef — claim not traceable (spec §7)`,
          `${where}.examples[${ei}]`,
        );
      }
    });
    blockHasExampleSource.set(b.id, blockHasSrc);

    if (b.examples.length === 0)
      add(
        "warn",
        "block_no_examples",
        `Block "${b.title}" has no worked examples (spec §3.3)`,
        where,
      );
  });

  // ----- Deck coverage -----
  const deck = buildDeck(pack);
  const deckBlockIds = new Set(
    deck.map((s) => s.blockId).filter((id): id is string => id != null),
  );
  const deckTitleSet = new Set(deck.map((s) => s.title));
  let blocksWithDeck = 0;
  for (const b of pack.blocks) {
    if (deckBlockIds.has(b.id)) blocksWithDeck++;
    else
      add(
        "error",
        "block_missing_from_deck",
        `Block "${b.title}" has no slide in the deck`,
        `blocks(${b.id})`,
      );
  }

  // ----- Plan coverage + plan↔deck alignment -----
  // Use the same default cadence as the plan route. If exam is past, use a
  // small fallback so the verifier still runs.
  const planDays = Math.max(3, Math.min(30, days >= 0 ? days : 7));
  const plan = buildPlan(pack, planDays);
  const planTitles = new Set<string>();
  for (const d of plan) for (const ref of d.slideRefs) planTitles.add(ref);

  for (const title of planTitles)
    if (!deckTitleSet.has(title))
      add(
        "error",
        "plan_ref_missing_from_deck",
        `Plan references slide "${title}" that does not exist in the deck (spec §3.7)`,
        "plan",
      );

  // Block coverage via plan: a block is "covered" if any plan day references a
  // slide whose title matches one of the block's deck-slide titles.
  const titleToBlock = new Map<string, string | null>();
  for (const s of deck) titleToBlock.set(s.title, s.blockId);
  const planBlocks = new Set<string>();
  for (const title of planTitles) {
    const bid = titleToBlock.get(title);
    if (bid) planBlocks.add(bid);
  }
  let blocksInPlan = 0;
  for (const b of pack.blocks) {
    if (planBlocks.has(b.id)) blocksInPlan++;
    else
      add(
        "warn",
        "block_missing_from_plan",
        `Block "${b.title}" is never referenced by the study plan`,
        `blocks(${b.id})`,
      );
  }

  // ----- Summaries integrity -----
  if (
    !pack.summaries.confusingPairs.length &&
    !pack.summaries.criticalConcepts.length &&
    !pack.summaries.traps.length &&
    !pack.summaries.typicalValues.length &&
    !pack.summaries.checklist.length
  )
    add("warn", "no_summaries", "Pack has no cross-block summaries (spec §3.5/§3.6)", "summaries");

  // ----- Coverage stats -----
  const coverage: VerifyCoverage = {
    exampleSourceRef: totalExamples ? examplesWithRef / totalExamples : 0,
    conceptSourceRef: totalConcepts ? conceptsWithRef / totalConcepts : 0,
    formulaSourceRef: totalFormulas ? formulasWithRef / totalFormulas : 0,
    blocksWithDeck: pack.blocks.length ? blocksWithDeck / pack.blocks.length : 0,
    blocksInPlan: pack.blocks.length ? blocksInPlan / pack.blocks.length : 0,
  };

  add(
    "info",
    "stats",
    `${pack.blocks.length} blocks · ${deck.length} slides · ${plan.length} plan days · ${pack.sources.length} sources`,
    "pack",
  );

  const counts = {
    error: findings.filter((f) => f.severity === "error").length,
    warn: findings.filter((f) => f.severity === "warn").length,
    info: findings.filter((f) => f.severity === "info").length,
  };

  return { packId: pack.course.id, findings, counts, coverage };
}
