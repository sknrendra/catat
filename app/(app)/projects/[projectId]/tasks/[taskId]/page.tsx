import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { issues, projectMembers, taskComments, tasks, user } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";
import { TaskDetail } from "@/components/TaskDetail";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>;
}) {
  const { projectId, taskId } = await params;
  const session = await requireSession();

  const membership = await getProjectMembership(projectId, session.user.id);
  if (!membership) notFound();

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)));
  if (!task) notFound();

  const members = await db
    .select({ userId: projectMembers.userId, name: user.name })
    .from(projectMembers)
    .innerJoin(user, eq(projectMembers.userId, user.id))
    .where(eq(projectMembers.projectId, projectId));

  let parentIssue: { id: string; title: string } | null = null;
  if (task.issueId) {
    const [row] = await db
      .select({ id: issues.id, title: issues.title })
      .from(issues)
      .where(eq(issues.id, task.issueId));
    parentIssue = row ?? null;
  }

  const commentRows = await db
    .select({
      id: taskComments.id,
      body: taskComments.body,
      createdAt: taskComments.createdAt,
      authorName: user.name,
    })
    .from(taskComments)
    .innerJoin(user, eq(taskComments.authorId, user.id))
    .where(eq(taskComments.taskId, taskId))
    .orderBy(asc(taskComments.createdAt));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <TaskDetail task={task} members={members} parentIssue={parentIssue} comments={commentRows} />
    </div>
  );
}
