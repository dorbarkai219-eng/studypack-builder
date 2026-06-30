import { z } from "zod";

/**
 * Class mode (handoff §4: "class mode" — teachers + students sharing
 * packs). Minimal viable shape: teacher owns the class, publishes one
 * or more packs to it, and students join via a short alphanumeric code.
 * Per-student progress / feedback persistence is deferred until auth
 * is required across deployments.
 */
export const ClassMemberSchema = z.object({
  /** Clerk userId of the student (or "demo-user-dev" when auth is off). */
  userId: z.string(),
  /** Optional display label the teacher sees. */
  label: z.string().optional(),
  /** ISO timestamp when the user joined. */
  joinedAt: z.string(),
});
export type ClassMember = z.infer<typeof ClassMemberSchema>;

export const StudyClassSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,40}$/),
  name: z.string().min(1).max(80),
  /** Clerk userId of the teacher (owner). */
  ownerId: z.string(),
  /** Pack ids published to this class. Members get access to these packs. */
  packIds: z.array(z.string()).default([]),
  /** Short join code — case-insensitive, 6 chars. Required to join. */
  joinCode: z.string().regex(/^[A-Z0-9]{6}$/),
  members: z.array(ClassMemberSchema).default([]),
  /** ISO timestamp. */
  createdAt: z.string(),
});
export type StudyClass = z.infer<typeof StudyClassSchema>;

export function parseClass(data: unknown): StudyClass {
  return StudyClassSchema.parse(data);
}

/** Generate a random 6-char A-Z 0-9 join code. */
export function makeJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit I,O,0,1 — readability
  let out = "";
  for (let i = 0; i < 6; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
