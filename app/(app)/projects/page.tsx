import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectMembers, projects } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { ProjectList } from "@/components/ProjectList";

export default async function ProjectsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      role: projectMembers.role,
      updatedAt: projects.updatedAt,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(desc(projects.updatedAt));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Projects</h1>
      <ProjectList projects={rows} />
    </div>
  );
}
