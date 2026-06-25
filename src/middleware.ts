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
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/packs", // list endpoint
]);

export default clerkMiddleware(async (auth, req) => {
  // No Clerk keys configured → middleware is a no-op (dev / unconfigured).
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return;
  if (!isPublic(req)) await auth.protect();
});

export const config = {
  // Match every route except Next's internals + static assets.
  matcher: ["/((?!_next|.*\\..*).*)"],
};
