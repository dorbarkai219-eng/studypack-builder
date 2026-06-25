/**
 * Plan data shapes (spec §4.5). The plan is DERIVED on each render via
 * `buildPlan(pack, totalDays)` — it's not persisted on the CoursePack —
 * so these are TypeScript types, not Zod schemas. Mirrors the
 * `src/lib/deck/types.ts` split: deck STRUCTURE lives next to its
 * builder, not in the shared schema.
 */

export interface PlanTask {
  task: string;
  done: boolean;
}

export interface PlanDay {
  day: number;
  phase: string;
  star: boolean;
  /** Slide titles in deck order (spec §3.7 plan↔deck alignment). */
  slideRefs: string[];
  learn: PlanTask[];
  practice: PlanTask[];
  goal: string;
  materials?: string;
}
