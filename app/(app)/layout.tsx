import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { notebooks, notes } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const userId = session.user.id;

  const notebookRows = await db
    .select()
    .from(notebooks)
    .where(eq(notebooks.userId, userId))
    .orderBy(asc(notebooks.sortOrder), desc(notebooks.createdAt));

  const noteRows = await db
    .select({
      id: notes.id,
      notebookId: notes.notebookId,
      title: notes.title,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt));

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar notebooks={notebookRows} notes={noteRows} userName={session.user.name} />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
