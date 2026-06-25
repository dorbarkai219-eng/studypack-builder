import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseCoursePack, type CoursePack } from "@/lib/coursepack/schema";

/**
 * Filesystem-backed pack store. The mock registry stays in-memory; ingested
 * packs are persisted under data/packs/{id}.json so they survive dev restarts
 * and Next's worker-per-route process model. Real auth/DB is M-later.
 */

const DIR = path.join(process.cwd(), "data", "packs");

export async function ensureDir(): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
}

export async function savePack(pack: CoursePack): Promise<void> {
  await ensureDir();
  const file = path.join(DIR, `${pack.course.id}.json`);
  await fs.writeFile(file, JSON.stringify(pack, null, 2), "utf8");
}

export async function loadStoredPacks(): Promise<CoursePack[]> {
  try {
    const files = await fs.readdir(DIR);
    const packs: CoursePack[] = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(DIR, f), "utf8");
        packs.push(parseCoursePack(JSON.parse(raw)));
      } catch (err) {
        // skip malformed file but log
        console.warn(`[store] skipped ${f}:`, err);
      }
    }
    return packs;
  } catch {
    return [];
  }
}

export async function getStoredPack(id: string): Promise<CoursePack | undefined> {
  try {
    const raw = await fs.readFile(path.join(DIR, `${id}.json`), "utf8");
    return parseCoursePack(JSON.parse(raw));
  } catch {
    return undefined;
  }
}
