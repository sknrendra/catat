import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  issueComments,
  issues,
  projectMembers,
  tasks,
  user,
  workAreas,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";
import { IssueDetail } from "@/components/IssueDetail";

export default async function IssuePage({
  params,
}: {
  params: Promise<{ projectId: string; issueId: string }>;
}) {
  const { projectId, issueId } = await params;
  const session = await requireSession();

  const membership = await getProjectMembership(projectId, session.user.id);
  if (!membership) notFound();

  const [issue] = await db
    .select()
    .from(issues)
    .where(and(eq(issues.id, issueId), eq(issues.projectId, projectId)));
  if (!issue) notFound();

  const members = await db
    .select({ userId: projectMembers.userId, name: user.name })
    .from(projectMembers)
    .innerJoin(user, eq(projectMembers.userId, user.id))
    .where(eq(projectMembers.projectId, projectId));

  const workAreaRows = await db
    .select({ id: workAreas.id, name: workAreas.name })
    .from(workAreas)
    .where(eq(workAreas.projectId, projectId));

  const taskRows = await db
    .select({ id: tasks.id, title: tasks.title, status: tasks.status })
    .from(tasks)
    .where(eq(tasks.issueId, issueId));

  const commentRows = await db
    .select({
      id: issueComments.id,
      body: issueComments.body,
      createdAt: issueComments.createdAt,
      authorName: user.name,
    })
    .from(issueComments)
    .innerJoin(user, eq(issueComments.authorId, user.id))
    .where(eq(issueComments.issueId, issueId))
    .orderBy(asc(issueComments.createdAt));

  const percentDone =
    taskRows.length === 0
      ? null
      : Math.round((taskRows.filter((t) => t.status === "done").length / taskRows.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <IssueDetail
        issue={{ ...issue, percentDone, taskCount: taskRows.length }}
        members={members}
        workAreas={workAreaRows}
        tasks={taskRows}
        comments={commentRows}
      />
    </div>
  );
}
