import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getOptionalUserId } from "@/lib/auth/userId";

/**
 * Auth controls — renders Sign-in/Sign-up links when signed out, and the
 * Clerk UserButton when signed in. Returns null when Clerk isn't
 * configured (env key unset) so demo / dev runs look clean.
 *
 * Server component: reads auth() once at render time. UserButton is the
 * only client-side widget — it self-mounts on hydration.
 */
export async function AuthHeaderControls() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  const userId = await getOptionalUserId();
  if (!userId) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="nb-btn px-3 py-1.5 text-sm"
        >
          התחברות
        </Link>
        <Link
          href="/sign-up"
          className="nb-btn nb-btn-primary px-3 py-1.5 text-sm"
        >
          הרשמה
        </Link>
      </div>
    );
  }
  return <UserButton />;
}
