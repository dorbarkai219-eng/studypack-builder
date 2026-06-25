import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseCoursePack, type CoursePack } from "@/lib/coursepack/schema";

/**
 * Per-user pack store — three async methods scoped by userId so user A
 * never sees user B's ingested packs. Mocks are NOT in the store; they
 * live in the registry and are public.
 *
 * Two adapters built in: fs (default — data/packs/{userId}/{id}.json)
 * and memory (process-lifetime). Pick with STUDYPACK_STORE env. A real
 * production backend (Vercel KV / Upstash / Postgres / R2) is a third
 * adapter added to this file.
 */

export interface PackStore {
  savePack(userId: string, pack: CoursePack): Promise<void>;
  loadStoredPacks(userId: string): Promise<CoursePack[]>;
  getStoredPack(userId: string, id: string): Promise<CoursePack | undefined>;
  deletePack(userId: string, id: string): Promise<boolean>;
}

// Defensive: refuse traversal / empty user ids so an attacker can't
// reach into another user's directory via `../`.
function safeUser(userId: string): string {
  if (!userId || /[/\\.]/.test(userId)) throw new Error(`invalid userId: ${userId}`);
  return userId;
}

// ── Filesystem adapter (dev default) ────────────────────────────────────────
const FS_ROOT = path.join(process.cwd(), "data", "packs");
const fsUserDir = (userId: string) => path.join(FS_ROOT, safeUser(userId));

const fsStore: PackStore = {
  async savePack(userId, pack) {
    const dir = fsUserDir(userId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${pack.course.id}.json`),
      JSON.stringify(pack, null, 2),
      "utf8",
    );
  },
  async loadStoredPacks(userId) {
    const dir = fsUserDir(userId);
    try {
      const files = await fs.readdir(dir);
      const packs: CoursePack[] = [];
      for (const f of files) {
        if (!f.endsWith(".json")) continue;
        try {
          const raw = await fs.readFile(path.join(dir, f), "utf8");
          packs.push(parseCoursePack(JSON.parse(raw)));
        } catch (err) {
          console.warn(`[store/fs] skipped ${userId}/${f}:`, err);
        }
      }
      return packs;
    } catch {
      return [];
    }
  },
  async getStoredPack(userId, id) {
    try {
      const raw = await fs.readFile(
        path.join(fsUserDir(userId), `${id}.json`),
        "utf8",
      );
      return parseCoursePack(JSON.parse(raw));
    } catch {
      return undefined;
    }
  },
  async deletePack(userId, id) {
    try {
      await fs.unlink(path.join(fsUserDir(userId), `${id}.json`));
      return true;
    } catch {
      return false;
    }
  },
};

// ── In-memory adapter ──────────────────────────────────────────────────────
const memoryPacks = new Map<string, Map<string, CoursePack>>();
function memUser(userId: string): Map<string, CoursePack> {
  const u = safeUser(userId);
  let bucket = memoryPacks.get(u);
  if (!bucket) {
    bucket = new Map();
    memoryPacks.set(u, bucket);
  }
  return bucket;
}
const memoryStore: PackStore = {
  async savePack(userId, pack) {
    memUser(userId).set(pack.course.id, pack);
  },
  async loadStoredPacks(userId) {
    return Array.from(memUser(userId).values());
  },
  async getStoredPack(userId, id) {
    return memUser(userId).get(id);
  },
  async deletePack(userId, id) {
    return memUser(userId).delete(id);
  },
};

function pickAdapter(): PackStore {
  const env = process.env.STUDYPACK_STORE?.toLowerCase();
  if (env === "memory") return memoryStore;
  return fsStore;
}

const adapter = pickAdapter();

export const savePack: PackStore["savePack"] = (u, p) => adapter.savePack(u, p);
export const loadStoredPacks: PackStore["loadStoredPacks"] = (u) =>
  adapter.loadStoredPacks(u);
export const getStoredPack: PackStore["getStoredPack"] = (u, id) =>
  adapter.getStoredPack(u, id);
export const deletePack: PackStore["deletePack"] = (u, id) =>
  adapter.deletePack(u, id);

export const adapters = { fs: fsStore, memory: memoryStore } as const;
