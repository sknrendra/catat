import { and, desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { db } from "@/lib/db";
import { notebooks, notes, projects } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { Editor } from "@/components/Editor";

export default async function NotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

  if (!note) notFound();

  const notebookRows = await db
    .select({ id: notebooks.id, name: notebooks.name })
    .from(notebooks)
    .where(and(eq(notebooks.userId, userId), isNull(notebooks.projectId)))
    .orderBy(desc(notebooks.createdAt));

  const projectRows = await db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));

  const [currentNotebook] = await db
    .select({ projectId: notebooks.projectId })
    .from(notebooks)
    .where(eq(notebooks.id, note.notebookId));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Editor
        key={note.id}
        noteId={note.id}
        location={
          currentNotebook?.projectId
            ? { kind: "project", id: currentNotebook.projectId }
            : { kind: "notebook", id: note.notebookId }
        }
        notebooks={notebookRows}
        projects={projectRows}
        initialTitle={note.title}
        initialContent={note.content as JSONContent}
      />
    </div>
  );
}
