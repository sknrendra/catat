import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cycles, issues, projectMembers, tasks, user } from "@/lib/db/schema";
import { CyclesBoard } from "@/components/CyclesBoard";

export default async function CyclesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const cycleRows = await db
    .select()
    .from(cycles)
    .where(eq(cycles.projectId, projectId))
    .orderBy(desc(cycles.startedAt));

  const members = await db
    .select({ userId: projectMembers.userId, name: user.name })
    .from(projectMembers)
    .innerJoin(user, eq(projectMembers.userId, user.id))
    .where(eq(projectMembers.projectId, projectId));
  const nameByUserId = new Map(members.map((m) => [m.userId, m.name]));

  const issueRows = await db
    .select({
      id: issues.id,
      title: issues.title,
      status: issues.status,
      assigneeId: issues.assigneeId,
      cycleId: issues.cycleId,
    })
    .from(issues)
    .where(eq(issues.projectId, projectId));

  const taskRows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      assigneeId: tasks.assigneeId,
      cycleId: tasks.cycleId,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const items = [
    ...issueRows.map((i) => ({
      id: i.id,
      type: "issue" as const,
      title: i.title,
      status: i.status,
      assigneeName: i.assigneeId ? nameByUserId.get(i.assigneeId) ?? null : null,
      cycleId: i.cycleId,
    })),
    ...taskRows.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      status: t.status,
      assigneeName: t.assigneeId ? nameByUserId.get(t.assigneeId) ?? null : null,
      cycleId: t.cycleId,
    })),
  ];

  return <CyclesBoard projectId={projectId} cycles={cycleRows} items={items} />;
}
