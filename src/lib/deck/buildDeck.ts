import type { CoursePack, Block } from "@/lib/coursepack/schema";
import type { DeckSlide, TocEntry } from "@/lib/deck/types";

/** Max formulas / concepts shown on a single slide before it splits (spec §4.3). */
const FORMULAS_PER_SLIDE = 2;
const CONCEPTS_PER_SLIDE = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Deterministic slide id — stable across calls so plan refs / export anchors never drift. */
function slideId(block: Block | null, kind: string, i = 0): string {
  const base = block ? `b${block.order}` : "x";
  return `${base}-${kind}-${i}`;
}

/** Slides for one block, in order: concept slide(s) → formula slide(s) → example slide. */
function blockSlides(block: Block): DeckSlide[] {
  const slides: DeckSlide[] = [];
  const common = {
    blockId: block.id,
    title: block.title,
    enTitle: block.enTitle,
    subtitle: block.framing,
    starLevel: block.starLevel,
  };

  chunk(block.concepts, CONCEPTS_PER_SLIDE).forEach((concepts, i) => {
    slides.push({
      ...common,
      id: slideId(block, "concept", i),
      kind: "concept",
      payload: { kind: "concept", concepts },
    });
  });

  chunk(block.formulas, FORMULAS_PER_SLIDE).forEach((formulas, i) => {
    slides.push({
      ...common,
      id: slideId(block, "formula", i),
      kind: "formula",
      payload: { kind: "formula", formulas },
    });
  });

  if (block.examples.length || block.mistakes.length || block.tips.length) {
    slides.push({
      ...common,
      id: slideId(block, "example", 0),
      kind: "example",
      payload: {
        kind: "example",
        examples: block.examples,
        mistakes: block.mistakes,
        tips: block.tips,
      },
    });
  }

  // Guarantee every block appears even if it had no concepts/formulas/examples.
  if (slides.length === 0) {
    slides.push({
      ...common,
      id: slideId(block, "concept", 0),
      kind: "concept",
      payload: { kind: "concept", concepts: [] },
    });
  }
  return slides;
}

/**
 * buildDeck — expand a CoursePack into an ordered, renderable slide list:
 * title → TOC → per-block slides → summary slides → closing (spec §4.3).
 * Pure & deterministic (no Date/random) → reproducible export + stable refs.
 */
export function buildDeck(pack: CoursePack): DeckSlide[] {
  const { course, blocks, summaries } = pack;
  const ordered = blocks.slice().sort((a, b) => a.order - b.order);

  // Build per-block slides first so the TOC can point at each block's first slide.
  const perBlock = ordered.map((b) => ({ block: b, slides: blockSlides(b) }));

  const tocEntries: TocEntry[] = perBlock.map(({ block, slides }) => ({
    blockId: block.id,
    title: block.title,
    enTitle: block.enTitle,
    starLevel: block.starLevel,
    slideId: slides[0].id,
  }));

  const slides: DeckSlide[] = [];

  slides.push({
    id: slideId(null, "title", 0),
    blockId: null,
    kind: "title",
    title: course.title,
    subtitle: course.subject,
    starLevel: 0,
    payload: {
      kind: "title",
      subject: course.subject,
      examDate: course.examDate,
      blockCount: ordered.length,
    },
  });

  slides.push({
    id: slideId(null, "toc", 0),
    blockId: null,
    kind: "toc",
    title: course.outputLanguage === "he" ? "תוכן עניינים" : "Contents",
    starLevel: 0,
    payload: { kind: "toc", entries: tocEntries },
  });

  perBlock.forEach(({ slides: s }) => slides.push(...s));

  if (summaries.confusingPairs.length) {
    slides.push({
      id: slideId(null, "sum-cmp", 0),
      blockId: null,
      kind: "summary-comparisons",
      title: course.outputLanguage === "he" ? "נוסחאות מבלבלות" : "Confusing pairs",
      starLevel: 0,
      payload: { kind: "summary-comparisons", pairs: summaries.confusingPairs },
    });
  }

  if (summaries.criticalConcepts.length || summaries.traps.length) {
    slides.push({
      id: slideId(null, "sum-ct", 0),
      blockId: null,
      kind: "summary-concepts-traps",
      title:
        course.outputLanguage === "he"
          ? "מושגי מפתח ומלכודות"
          : "Critical concepts & traps",
      starLevel: 0,
      payload: {
        kind: "summary-concepts-traps",
        criticalConcepts: summaries.criticalConcepts,
        traps: summaries.traps,
      },
    });
  }

  if (summaries.typicalValues.length || summaries.checklist.length) {
    slides.push({
      id: slideId(null, "sum-sanity", 0),
      blockId: null,
      kind: "summary-sanity",
      title:
        course.outputLanguage === "he" ? "ערכים אופייניים וצ׳קליסט" : "Sanity & checklist",
      starLevel: 0,
      payload: {
        kind: "summary-sanity",
        typicalValues: summaries.typicalValues,
        checklist: summaries.checklist,
      },
    });
  }

  slides.push({
    id: slideId(null, "closing", 0),
    blockId: null,
    kind: "closing",
    title: course.outputLanguage === "he" ? "בהצלחה במבחן!" : "Good luck on the exam!",
    starLevel: 0,
    payload: { kind: "closing", examDate: course.examDate },
  });

  return slides;
}
