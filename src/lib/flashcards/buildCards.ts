import type { CoursePack, TermKeyEntry } from "@/lib/coursepack/schema";

/**
 * buildCards — derive a flashcard deck from a CoursePack.
 *
 * Like buildDeck/buildPlan, cards are NOT persisted on the pack; they are
 * rebuilt fresh on every render so they can never drift from the source
 * of truth. Card ids are stable (block id + index) so spaced-repetition
 * state stored per id survives re-derivation.
 */

export type FlashcardKind = "concept" | "formula" | "pair";

export interface Flashcard {
  /** Stable id — SRS state is keyed by this. */
  id: string;
  kind: FlashcardKind;
  /** Question side. */
  front: string;
  /** Optional Latin/English term shown next to the front (mixed titles). */
  frontEn?: string;
  /** Answer side. */
  back: string;
  /** Render the back LTR-isolated (formulas). */
  ltrBack?: boolean;
  /** Per-card symbol key (formula cards). */
  termKey?: TermKeyEntry[];
  /** Block the card came from — shown as a context chip. */
  blockTitle: string;
  /** Star level inherited from the block (0/1/2). */
  starLevel: number;
}

export function buildCards(pack: CoursePack): Flashcard[] {
  const cards: Flashcard[] = [];

  const blocks = pack.blocks.slice().sort((a, b) => a.order - b.order);
  for (const b of blocks) {
    b.concepts.forEach((c, i) => {
      cards.push({
        id: `c:${b.id}:${i}`,
        kind: "concept",
        front: c.term,
        frontEn: c.enTerm,
        back: c.explanation,
        blockTitle: b.title,
        starLevel: b.starLevel,
      });
    });
    b.formulas.forEach((f, i) => {
      cards.push({
        id: `f:${b.id}:${i}`,
        kind: "formula",
        front: f.intuition,
        back: f.latexOrText,
        ltrBack: true,
        termKey: f.termKey,
        blockTitle: b.title,
        starLevel: b.starLevel,
      });
    });
  }

  pack.summaries.confusingPairs.forEach((p, i) => {
    cards.push({
      id: `p:${i}`,
      kind: "pair",
      front: p.title,
      back: `${p.left} ⟵ ${p.whenLeft}\n${p.right} ⟵ ${p.whenRight}`,
      blockTitle: p.title,
      starLevel: 0,
    });
  });

  return cards;
}
