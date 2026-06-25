import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseCoursePack, type CoursePack } from "@/lib/coursepack/schema";

/**
 * Pack store — a tiny three-method async interface (savePack /
 * loadStoredPacks / getStoredPack) that any backend can implement. The
 * default impl persists JSON to data/packs/{id}.json, which is fine in
 * dev but breaks on serverless deploys where the disk is ephemeral and
 * read-only at request time.
 *
 * Swap by setting STUDYPACK_STORE: "fs" (default) or "memory". A real
 * KV / Postgres / R2 backend would add a new branch here without
 * touching anything in the route or registry layer.
 */

export interface PackStore {
  savePack(pack: CoursePack): Promise<void>;
  loadStoredPacks(): Promise<CoursePack[]>;
  getStoredPack(id: string): Promise<CoursePack | undefined>;
}

// ── Filesystem adapter (dev default) ────────────────────────────────────────
const FS_DIR = path.join(process.cwd(), "data", "packs");

const fsStore: PackStore = {
  async savePack(pack) {
    await fs.mkdir(FS_DIR, { recursive: true });
    await fs.writeFile(
      path.join(FS_DIR, `${pack.course.id}.json`),
      JSON.stringify(pack, null, 2),
      "utf8",
    );
  },
  async loadStoredPacks() {
    try {
      const files = await fs.readdir(FS_DIR);
      const packs: CoursePack[] = [];
      for (const f of files) {
        if (!f.endsWith(".json")) continue;
        try {
          const raw = await fs.readFile(path.join(FS_DIR, f), "utf8");
          packs.push(parseCoursePack(JSON.parse(raw)));
        } catch (err) {
          console.warn(`[store/fs] skipped ${f}:`, err);
        }
      }
      return packs;
    } catch {
      return [];
    }
  },
  async getStoredPack(id) {
    try {
      const raw = await fs.readFile(path.join(FS_DIR, `${id}.json`), "utf8");
      return parseCoursePack(JSON.parse(raw));
    } catch {
      return undefined;
    }
  },
};

// ── In-memory adapter (serverless-friendly within a single instance) ───────
// Survives the process lifetime — fine for demos and `next start`; lost on
// cold starts. A real serverless deploy should swap in a KV / DB adapter.
const memoryPacks = new Map<string, CoursePack>();
const memoryStore: PackStore = {
  async savePack(pack) {
    memoryPacks.set(pack.course.id, pack);
  },
  async loadStoredPacks() {
    return Array.from(memoryPacks.values());
  },
  async getStoredPack(id) {
    return memoryPacks.get(id);
  },
};

function pickAdapter(): PackStore {
  const env = process.env.STUDYPACK_STORE?.toLowerCase();
  if (env === "memory") return memoryStore;
  // Default to fs even when env is unset / unknown — dev-friendly.
  return fsStore;
}

const adapter = pickAdapter();

export const savePack: PackStore["savePack"] = (p) => adapter.savePack(p);
export const loadStoredPacks: PackStore["loadStoredPacks"] = () =>
  adapter.loadStoredPacks();
export const getStoredPack: PackStore["getStoredPack"] = (id) =>
  adapter.getStoredPack(id);

/** Exposed for direct adapter access if a caller really wants a specific impl. */
export const adapters = { fs: fsStore, memory: memoryStore } as const;
