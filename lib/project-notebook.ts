import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notebooks, projects } from "@/lib/db/schema";

// A project's notes live in a notebook linked via notebooks.projectId. It's
// created on first use, so most projects never get one. Returns null when
// the project doesn't exist or isn't the user's.
export async function getOrCreateProjectNotebookId(
  projectId: string,
  userId: string,
): Promise<string | null> {
  const [project] = await db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  if (!project) return null;

  const [existing] = await db
    .select({ id: notebooks.id })
    .from(notebooks)
    .where(eq(notebooks.projectId, projectId));
  if (existing) return existing.id;

  const [created] = await db
    .insert(notebooks)
    .values({ id: crypto.randomUUID(), userId, name: project.title, projectId })
    .onConflictDoNothing({ target: notebooks.projectId })
    .returning({ id: notebooks.id });
  if (created) return created.id;

  // Lost a race with a concurrent request creating the same notebook.
  const [raced] = await db
    .select({ id: notebooks.id })
    .from(notebooks)
    .where(eq(notebooks.projectId, projectId));
  return raced?.id ?? null;
}
