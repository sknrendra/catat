import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { issues, projectMembers, projects, tasks, user, workAreas } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { ProjectOverview } from "@/components/ProjectOverview";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) notFound();

  const members = await db
    .select({
      id: projectMembers.id,
      userId: projectMembers.userId,
      role: projectMembers.role,
      name: user.name,
      email: user.email,
    })
    .from(projectMembers)
    .innerJoin(user, eq(projectMembers.userId, user.id))
    .where(eq(projectMembers.projectId, projectId));

  const isOwner = members.some((m) => m.userId === userId && m.role === "owner");

  const issueRows = await db
    .select({ id: issues.id })
    .from(issues)
    .where(eq(issues.projectId, projectId));
  const taskRows = await db
    .select({ id: tasks.id, status: tasks.status })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const workAreaRows = await db
    .select({ id: workAreas.id, name: workAreas.name, color: workAreas.color })
    .from(workAreas)
    .where(eq(workAreas.projectId, projectId));

  return (
    <ProjectOverview
      project={project}
      isOwner={isOwner}
      members={members}
      workAreas={workAreaRows}
      stats={{
        issueCount: issueRows.length,
        taskCount: taskRows.length,
        doneTaskCount: taskRows.filter((t) => t.status === "done").length,
      }}
    />
  );
}
