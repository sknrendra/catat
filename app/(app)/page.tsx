import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notebooks, notes } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { NewNoteButton } from "@/components/NewNoteButton";

export default async function AppHomePage() {
  const session = await requireSession();
  const userId = session.user.id;

  const recentNotes = await db
    .select({
      id: notes.id,
      title: notes.title,
      updatedAt: notes.updatedAt,
      notebookName: notebooks.name,
    })
    .from(notes)
    .innerJoin(notebooks, eq(notes.notebookId, notebooks.id))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(8);

  const recentNotebooks = await db
    .select()
    .from(notebooks)
    .where(eq(notebooks.userId, userId))
    .orderBy(desc(notebooks.updatedAt))
    .limit(5);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Home</h1>
        <NewNoteButton />
      </div>

      {recentNotes.length === 0 && recentNotebooks.length === 0 ? (
        <p className="text-sm text-foreground/50">
          Select a notebook, or create one to get started.
        </p>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
              Recent notes
            </h2>
            {recentNotes.length === 0 ? (
              <p className="text-sm text-foreground/50">No notes yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <Link
                      href={`/notes/${note.id}`}
                      className="flex items-center justify-between gap-4 px-1 py-3 hover:bg-foreground/5"
                    >
                      <span className="truncate text-sm">{note.title || "Untitled"}</span>
                      <span className="flex shrink-0 items-center gap-3 text-xs text-foreground/40">
                        <span className="truncate">{note.notebookName}</span>
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
              Notebooks
            </h2>
            {recentNotebooks.length === 0 ? (
              <p className="text-sm text-foreground/50">No notebooks yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
                {recentNotebooks.map((notebook) => (
                  <li key={notebook.id}>
                    <Link
                      href={`/notebooks/${notebook.id}`}
                      className="block px-1 py-3 text-sm hover:bg-foreground/5"
                    >
                      {notebook.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
