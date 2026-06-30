import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseClass, type StudyClass } from "@/lib/classes/schema";

/**
 * Class store — mirrors PackStore shape (handoff §4 class mode). Two
 * lookups: by-id (for owner ops) and by-code (for join). fs adapter
 * writes data/classes/{id}.json plus a tiny by-code/{CODE} index so
 * we don't have to scan the directory on every join.
 *
 * Backed by the same STUDYPACK_STORE env that controls the pack store.
 */

export interface ClassStore {
  saveClass(cls: StudyClass): Promise<void>;
  listClassesOwnedBy(ownerId: string): Promise<StudyClass[]>;
  listClassesMemberOf(userId: string): Promise<StudyClass[]>;
  getClass(id: string): Promise<StudyClass | undefined>;
  getClassByCode(code: string): Promise<StudyClass | undefined>;
  deleteClass(id: string): Promise<boolean>;
}

function sanitizeId(id: string): string {
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(id))
    throw new Error(`invalid class id: ${id}`);
  return id;
}
function sanitizeCode(code: string): string {
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error(`invalid join code: ${code}`);
  return code;
}

// ── Filesystem adapter ─────────────────────────────────────────────────────
const FS_ROOT = path.join(process.cwd(), "data", "classes");
const FS_INDEX = path.join(FS_ROOT, "by-code");

const fsStore: ClassStore = {
  async saveClass(cls) {
    await fs.mkdir(FS_ROOT, { recursive: true });
    await fs.mkdir(FS_INDEX, { recursive: true });
    await fs.writeFile(
      path.join(FS_ROOT, `${sanitizeId(cls.id)}.json`),
      JSON.stringify(cls, null, 2),
      "utf8",
    );
    await fs.writeFile(
      path.join(FS_INDEX, `${sanitizeCode(cls.joinCode)}.txt`),
      cls.id,
      "utf8",
    );
  },
  async listClassesOwnedBy(ownerId) {
    try {
      const files = await fs.readdir(FS_ROOT);
      const out: StudyClass[] = [];
      for (const f of files) {
        if (!f.endsWith(".json")) continue;
        try {
          const raw = await fs.readFile(path.join(FS_ROOT, f), "utf8");
          const cls = parseClass(JSON.parse(raw));
          if (cls.ownerId === ownerId) out.push(cls);
        } catch {
          /* skip */
        }
      }
      return out;
    } catch {
      return [];
    }
  },
  async listClassesMemberOf(userId) {
    try {
      const files = await fs.readdir(FS_ROOT);
      const out: StudyClass[] = [];
      for (const f of files) {
        if (!f.endsWith(".json")) continue;
        try {
          const raw = await fs.readFile(path.join(FS_ROOT, f), "utf8");
          const cls = parseClass(JSON.parse(raw));
          if (cls.members.some((m) => m.userId === userId)) out.push(cls);
        } catch {
          /* skip */
        }
      }
      return out;
    } catch {
      return [];
    }
  },
  async getClass(id) {
    try {
      const raw = await fs.readFile(
        path.join(FS_ROOT, `${sanitizeId(id)}.json`),
        "utf8",
      );
      return parseClass(JSON.parse(raw));
    } catch {
      return undefined;
    }
  },
  async getClassByCode(code) {
    try {
      const id = (
        await fs.readFile(path.join(FS_INDEX, `${sanitizeCode(code)}.txt`), "utf8")
      ).trim();
      return fsStore.getClass(id);
    } catch {
      return undefined;
    }
  },
  async deleteClass(id) {
    try {
      const cls = await fsStore.getClass(id);
      await fs.unlink(path.join(FS_ROOT, `${sanitizeId(id)}.json`));
      if (cls)
        await fs
          .unlink(path.join(FS_INDEX, `${sanitizeCode(cls.joinCode)}.txt`))
          .catch(() => undefined);
      return true;
    } catch {
      return false;
    }
  },
};

// ── In-memory adapter ─────────────────────────────────────────────────────
const memById = new Map<string, StudyClass>();
const memByCode = new Map<string, string>();
const memoryStore: ClassStore = {
  async saveClass(cls) {
    memById.set(sanitizeId(cls.id), cls);
    memByCode.set(sanitizeCode(cls.joinCode), cls.id);
  },
  async listClassesOwnedBy(ownerId) {
    return Array.from(memById.values()).filter((c) => c.ownerId === ownerId);
  },
  async listClassesMemberOf(userId) {
    return Array.from(memById.values()).filter((c) =>
      c.members.some((m) => m.userId === userId),
    );
  },
  async getClass(id) {
    return memById.get(sanitizeId(id));
  },
  async getClassByCode(code) {
    const id = memByCode.get(sanitizeCode(code));
    return id ? memById.get(id) : undefined;
  },
  async deleteClass(id) {
    const existing = memById.get(sanitizeId(id));
    if (!existing) return false;
    memById.delete(id);
    memByCode.delete(existing.joinCode);
    return true;
  },
};

function pickAdapter(): ClassStore {
  const env = process.env.STUDYPACK_STORE?.toLowerCase();
  if (env === "memory") return memoryStore;
  return fsStore;
}
const adapter = pickAdapter();

export const saveClass: ClassStore["saveClass"] = (c) => adapter.saveClass(c);
export const listClassesOwnedBy: ClassStore["listClassesOwnedBy"] = (u) =>
  adapter.listClassesOwnedBy(u);
export const listClassesMemberOf: ClassStore["listClassesMemberOf"] = (u) =>
  adapter.listClassesMemberOf(u);
export const getClass: ClassStore["getClass"] = (id) => adapter.getClass(id);
export const getClassByCode: ClassStore["getClassByCode"] = (c) =>
  adapter.getClassByCode(c);
export const deleteClass: ClassStore["deleteClass"] = (id) =>
  adapter.deleteClass(id);

export const classAdapters = { fs: fsStore, memory: memoryStore } as const;
