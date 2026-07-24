import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectMembers } from "@/lib/db/schema";

/** Returns the caller's membership row for a project, or null if they aren't a member. */
export async function getProjectMembership(projectId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

  return membership ?? null;
}
