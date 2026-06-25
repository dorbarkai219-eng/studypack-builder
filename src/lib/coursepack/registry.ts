import type { CoursePack } from "@/lib/coursepack/schema";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";
import { getStoredPack, loadStoredPacks } from "@/lib/coursepack/store";

/**
 * Pack registry. Mocks are baked in for demos + tests; ingested packs live on
 * disk under data/packs/ and are merged in async. Ingested packs win on id
 * collision (lets a user re-ingest with the same id and override the demo).
 */
const MOCKS: Record<string, CoursePack> = {
  [hebrewFinancePack.course.id]: hebrewFinancePack,
  [englishBiologyPack.course.id]: englishBiologyPack,
};

export async function getPack(id: string): Promise<CoursePack | undefined> {
  const stored = await getStoredPack(id);
  if (stored) return stored;
  return MOCKS[id];
}

export async function listPacks(): Promise<CoursePack[]> {
  const stored = await loadStoredPacks();
  const map = new Map<string, CoursePack>();
  for (const p of Object.values(MOCKS)) map.set(p.course.id, p);
  for (const p of stored) map.set(p.course.id, p); // ingested wins
  return Array.from(map.values());
}
