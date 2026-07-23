import "server-only";
import type { CoursePack } from "@/lib/coursepack/schema";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";
import { businessStrategyPack } from "@/lib/coursepack/mocks/business-strategy";
import { getStoredPack, loadStoredPacks } from "@/lib/coursepack/store";
import { getOptionalUserId } from "@/lib/auth/userId";

/**
 * Pack registry. Mocks are public + baked in for demos; ingested packs
 * live in the per-user store. Routes that ask for a pack get the
 * stored-then-mock merge for the current user.
 */
const MOCKS: Record<string, CoursePack> = {
  [hebrewFinancePack.course.id]: hebrewFinancePack,
  [englishBiologyPack.course.id]: englishBiologyPack,
  [businessStrategyPack.course.id]: businessStrategyPack,
};

export async function getPack(id: string): Promise<CoursePack | undefined> {
  const userId = await getOptionalUserId();
  if (userId) {
    const stored = await getStoredPack(userId, id);
    if (stored) return stored;
  }
  return MOCKS[id];
}

export async function listPacks(): Promise<CoursePack[]> {
  const userId = await getOptionalUserId();
  const stored = userId ? await loadStoredPacks(userId) : [];
  const map = new Map<string, CoursePack>();
  for (const p of Object.values(MOCKS)) map.set(p.course.id, p);
  for (const p of stored) map.set(p.course.id, p);
  return Array.from(map.values());
}

export function listMockPackIds(): string[] {
  return Object.keys(MOCKS);
}
