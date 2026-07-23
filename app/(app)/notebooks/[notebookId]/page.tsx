import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { notebooks, notes } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { NoteList } from "@/components/NoteList";

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ notebookId: string }>;
}) {
  const { notebookId } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [notebook] = await db
    .select()
    .from(notebooks)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, userId)));

  if (!notebook) notFound();

  const noteRows = await db
    .select({
      id: notes.id,
      notebookId: notes.notebookId,
      title: notes.title,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(eq(notes.notebookId, notebookId), eq(notes.userId, userId)))
    .orderBy(desc(notes.updatedAt));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">{notebook.name}</h1>
      <NoteList notebookId={notebook.id} notes={noteRows} />
    </div>
  );
}
