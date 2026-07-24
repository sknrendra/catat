import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { issues, workAreas } from "@/lib/db/schema";
import { Timeline } from "@/components/Timeline";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const issueRows = await db
    .select({
      id: issues.id,
      title: issues.title,
      status: issues.status,
      workAreaId: issues.workAreaId,
      expectedStart: issues.expectedStart,
      expectedEnd: issues.expectedEnd,
    })
    .from(issues)
    .where(
      and(
        eq(issues.projectId, projectId),
        isNotNull(issues.expectedStart),
        isNotNull(issues.expectedEnd),
      ),
    )
    .orderBy(asc(issues.expectedStart));

  const workAreaRows = await db
    .select()
    .from(workAreas)
    .where(eq(workAreas.projectId, projectId))
    .orderBy(asc(workAreas.sortOrder));

  const groups = [
    ...workAreaRows.map((wa) => ({
      id: wa.id,
      name: wa.name,
      color: wa.color,
      issues: issueRows
        .filter((i) => i.workAreaId === wa.id)
        .map((i) => ({
          id: i.id,
          title: i.title,
          status: i.status,
          expectedStart: i.expectedStart!,
          expectedEnd: i.expectedEnd!,
        })),
    })),
    {
      id: null,
      name: "Ungrouped",
      color: "#6b7280",
      issues: issueRows
        .filter((i) => !i.workAreaId)
        .map((i) => ({
          id: i.id,
          title: i.title,
          status: i.status,
          expectedStart: i.expectedStart!,
          expectedEnd: i.expectedEnd!,
        })),
    },
  ].filter((g) => g.issues.length > 0);

  return <Timeline projectId={projectId} groups={groups} />;
}
