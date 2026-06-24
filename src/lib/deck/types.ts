import type {
  Concept,
  Formula,
  Example,
  Summaries,
} from "@/lib/coursepack/schema";

/**
 * DeckSlide — a renderable slide expanded from a CoursePack by buildDeck().
 * This (not schema.DeckSchema) is the source of truth for deck STRUCTURE;
 * the study plan (M6) reads slide id/title from here for plan↔deck alignment.
 */
export type DeckSlideKind =
  | "title"
  | "toc"
  | "concept"
  | "formula"
  | "example"
  | "summary-comparisons"
  | "summary-concepts-traps"
  | "summary-sanity"
  | "closing";

export interface TocEntry {
  blockId: string;
  title: string;
  enTitle?: string;
  starLevel: number;
  /** id of the first slide for this block — TOC jumps here. */
  slideId: string;
}

export type SlidePayload =
  | { kind: "title"; subject: string; examDate: string; blockCount: number }
  | { kind: "toc"; entries: TocEntry[] }
  | { kind: "concept"; concepts: Concept[] }
  | { kind: "formula"; formulas: Formula[] }
  | { kind: "example"; examples: Example[]; mistakes: string[]; tips: string[] }
  | { kind: "summary-comparisons"; pairs: Summaries["confusingPairs"] }
  | {
      kind: "summary-concepts-traps";
      criticalConcepts: string[];
      traps: string[];
    }
  | { kind: "summary-sanity"; typicalValues: Summaries["typicalValues"]; checklist: string[] }
  | { kind: "closing"; examDate: string };

export interface DeckSlide {
  id: string;
  blockId: string | null;
  kind: DeckSlideKind;
  title: string;
  enTitle?: string;
  subtitle?: string;
  /** Priority star level inherited from the block (0/1/2). */
  starLevel: number;
  payload: SlidePayload;
}
