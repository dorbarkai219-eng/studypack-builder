import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Public routes (everything else requires sign-in once Clerk keys are
 * configured): home + mock pack pages stay open so demos work, sign-in
 * UI must obviously be reachable, and the public list / health
 * endpoints stay open.
 *
 * Protected routes: /ingest + /api/ingest + /api/packs/[id] CRUD.
 */
const isPublic = createRouteMatcher([
  "/",
  "/cheatsheet/(.*)",
  "/deck/(.*)",
  "/plan/(.*)",
  "/verify/(.*)",
  "/practice/(.*)",
  "/join/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/packs",
]);

const hasClerk =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

// When Clerk keys are absent (dev / preview without auth), middleware is a
// no-op — clerkMiddleware itself fails to initialize without keys, so the
// guard must happen before the factory call, not inside its callback.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noopMiddleware = (_req: NextRequest): void => undefined;

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublic(req)) await auth.protect();
    })
  : noopMiddleware;

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
