import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Returns the current user's id, or null if unauthenticated. */
export async function getUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.user.id ?? null;
}

/**
 * For server components under the (app) route group. The proxy only checks
 * for a session *cookie* (cheap, no DB lookup) before letting a request
 * through, so a stale or invalidated cookie (e.g. after rotating
 * BETTER_AUTH_SECRET) can still reach here with no real session — this does
 * the actual verification and bounces to sign-in if it fails.
 */
export async function requireSession() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");
  return session;
}
