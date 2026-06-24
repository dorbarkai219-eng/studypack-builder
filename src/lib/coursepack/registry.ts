import type { CoursePack } from "@/lib/coursepack/schema";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

/**
 * Mock pack registry. Replaced by a DB/ingestion lookup in later milestones —
 * keep the shape (id -> CoursePack) stable so callers don't change.
 */
const PACKS: Record<string, CoursePack> = {
  [hebrewFinancePack.course.id]: hebrewFinancePack,
  [englishBiologyPack.course.id]: englishBiologyPack,
};

export function getPack(id: string): CoursePack | undefined {
  return PACKS[id];
}

export function listPacks(): CoursePack[] {
  return Object.values(PACKS);
}
