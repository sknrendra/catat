import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { Editor } from "@/components/Editor";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicNotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.isPublic, true)));

  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Editor
        key={note.id}
        noteId={note.id}
        initialTitle={note.title}
        initialContent={note.content as JSONContent}
      />
    </div>
  );
}
