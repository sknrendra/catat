import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { db } from "@/lib/db";
import { backlogs, projects } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { BacklogEditor } from "@/components/BacklogEditor";

export default async function BacklogPage({
  params,
}: {
  params: Promise<{ backlogId: string }>;
}) {
  const { backlogId } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [backlog] = await db
    .select()
    .from(backlogs)
    .where(and(eq(backlogs.id, backlogId), eq(backlogs.userId, userId)));

  if (!backlog) notFound();

  const projectRows = await db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));

  const childItems = backlog.parentId
    ? []
    : await db
        .select({
          id: backlogs.id,
          title: backlogs.title,
          status: backlogs.status,
          label: backlogs.label,
        })
        .from(backlogs)
        .where(and(eq(backlogs.parentId, backlog.id), eq(backlogs.userId, userId)))
        .orderBy(desc(backlogs.updatedAt));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <BacklogEditor
        key={backlog.id}
        backlogId={backlog.id}
        projectId={backlog.projectId}
        projects={projectRows}
        initialTitle={backlog.title}
        initialContent={backlog.content as JSONContent}
        initialStatus={backlog.status}
        initialLabel={backlog.label}
        isChild={!!backlog.parentId}
        childItems={childItems}
      />
    </div>
  );
}
