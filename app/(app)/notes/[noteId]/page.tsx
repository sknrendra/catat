import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Editor
        key={note.id}
        noteId={note.id}
        notebookId={note.notebookId}
        initialTitle={note.title}
        initialContent={note.content as JSONContent}
      />
    </div>
  );
}
