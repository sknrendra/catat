import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { backlogs, cycleBacklogs, cycles, projects } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { CycleView } from "@/components/CycleView";
import { CycleItemList } from "@/components/CycleItemList";

export default async function CyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [cycle] = await db
    .select()
    .from(cycles)
    .where(and(eq(cycles.id, cycleId), eq(cycles.userId, userId)));

  if (!cycle) notFound();

  const [project] = await db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(eq(projects.id, cycle.projectId));

  const items = await db
    .select({
      id: backlogs.id,
      title: backlogs.title,
      status: backlogs.status,
      label: backlogs.label,
      updatedAt: backlogs.updatedAt,
    })
    .from(cycleBacklogs)
    .innerJoin(backlogs, eq(cycleBacklogs.backlogId, backlogs.id))
    .where(eq(cycleBacklogs.cycleId, cycleId))
    .orderBy(desc(backlogs.updatedAt));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <CycleView cycle={cycle} projectTitle={project?.title ?? "Project"} />
      <CycleItemList items={items} />
    </div>
  );
}
