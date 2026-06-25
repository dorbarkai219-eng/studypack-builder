import "server-only";
import { auth } from "@clerk/nextjs/server";

const DEV_USER = "demo-user-dev";

/**
 * Returns the current Clerk user id, or a single shared dev sentinel if
 * Clerk isn't configured (no publishable key). Routes that hand this to
 * the store get user-scoped persistence when auth is on, and behave
 * like a single-user app when it's off.
 */
export async function getUserId(): Promise<string> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return DEV_USER;
  const { userId } = await auth();
  if (!userId) throw new Error("unauthenticated");
  return userId;
}

/** Cheap unauth-aware variant — returns null instead of throwing when no user. */
export async function getOptionalUserId(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return DEV_USER;
  const { userId } = await auth();
  return userId ?? null;
}
