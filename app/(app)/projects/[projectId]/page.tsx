import { and, desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { backlogs, cycles, projects } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { BacklogList } from "@/components/BacklogList";
import { CurrentCycleSection } from "@/components/CurrentCycleSection";
import { ProjectDescription } from "@/components/ProjectDescription";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  if (!project) notFound();

  const backlogRows = await db
    .select({
      id: backlogs.id,
      projectId: backlogs.projectId,
      title: backlogs.title,
      status: backlogs.status,
      label: backlogs.label,
      updatedAt: backlogs.updatedAt,
    })
    .from(backlogs)
    .where(and(eq(backlogs.projectId, projectId), eq(backlogs.userId, userId)))
    .orderBy(desc(backlogs.updatedAt));

  const [currentCycle] = await db
    .select()
    .from(cycles)
    .where(
      and(
        eq(cycles.projectId, projectId),
        eq(cycles.userId, userId),
        inArray(cycles.status, ["planned", "active"]),
      ),
    )
    .orderBy(desc(cycles.updatedAt))
    .limit(1);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-4 text-xl font-semibold tracking-tight">{project.title}</h1>
      <ProjectDescription projectId={project.id} initialDescription={project.description} />
      <CurrentCycleSection
        projectId={project.id}
        cycle={currentCycle ?? null}
        backlogs={backlogRows}
      />
      <BacklogList projectId={project.id} backlogs={backlogRows} />
    </div>
  );
}
