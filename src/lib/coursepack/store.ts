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

// ── Upstash Redis (REST) adapter — durable + serverless-friendly ────────────
// Talks to Upstash's REST API with plain fetch (no SDK dependency, so npm ci
// stays untouched). Reads are FAIL-SOFT: on any error they return empty /
// undefined, so the app still renders the public mock packs even before the
// Redis store is provisioned. Writes throw, surfacing misconfiguration at
// ingest time. Reads either KV_* (Vercel Marketplace naming) or UPSTASH_*.
function redisEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}
async function redisCmd(cmd: (string | number)[]): Promise<unknown> {
  const env = redisEnv();
  if (!env)
    throw new Error("Redis not configured — set KV_REST_API_URL + KV_REST_API_TOKEN");
  const res = await fetch(env.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${String(cmd[0])} failed: HTTP ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`Redis ${String(cmd[0])}: ${json.error}`);
  return json.result;
}
const packKey = (u: string, id: string) => `pack:${safeUser(u)}:${id}`;
const packSetKey = (u: string) => `packs:${safeUser(u)}`;

const redisStore: PackStore = {
  async savePack(userId, pack) {
    await redisCmd(["SET", packKey(userId, pack.course.id), JSON.stringify(pack)]);
    await redisCmd(["SADD", packSetKey(userId), pack.course.id]);
  },
  async loadStoredPacks(userId) {
    try {
      const ids =
        ((await redisCmd(["SMEMBERS", packSetKey(userId)])) as string[]) ?? [];
      const packs: CoursePack[] = [];
      for (const id of ids) {
        try {
          const raw = (await redisCmd(["GET", packKey(userId, id)])) as
            | string
            | null;
          if (raw) packs.push(parseCoursePack(JSON.parse(raw)));
        } catch (err) {
          console.warn(`[store/redis] skipped ${userId}/${id}:`, err);
        }
      }
      return packs;
    } catch (err) {
      console.warn("[store/redis] loadStoredPacks failed:", err);
      return [];
    }
  },
  async getStoredPack(userId, id) {
    try {
      const raw = (await redisCmd(["GET", packKey(userId, id)])) as string | null;
      return raw ? parseCoursePack(JSON.parse(raw)) : undefined;
    } catch (err) {
      console.warn("[store/redis] getStoredPack failed:", err);
      return undefined;
    }
  },
  async deletePack(userId, id) {
    const removed = (await redisCmd(["DEL", packKey(userId, id)])) as number;
    await redisCmd(["SREM", packSetKey(userId), id]);
    return removed > 0;
  },
};

function pickAdapter(): PackStore {
  const env = process.env.STUDYPACK_STORE?.toLowerCase();
  if (env === "memory") return memoryStore;
  if (env === "redis") return redisStore;
  // Auto-upgrade: prefer Redis whenever its env is present, even without the
  // explicit flag — connecting the store becomes the only step needed.
  if (redisEnv()) return redisStore;
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

export const adapters = { fs: fsStore, memory: memoryStore, redis: redisStore } as const;
