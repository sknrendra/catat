import Link from "next/link";
import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { extractPlainText } from "@/lib/tiptap-text";
import type { JSONContent } from "@tiptap/core";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const session = await requireSession();
  const userId = session.user.id;

  const rows = query
    ? await db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.userId, userId),
            or(like(notes.title, `%${query}%`), like(notes.content, `%${query}%`)),
          ),
        )
        .orderBy(desc(notes.updatedAt))
        .limit(50)
    : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">
        {query ? `Results for “${query}”` : "Search"}
      </h1>

      {query && rows.length === 0 && (
        <p className="text-sm text-foreground/50">No notes matched your search.</p>
      )}

      <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
        {rows.map((note) => {
          const snippet = extractPlainText(note.content as JSONContent).slice(0, 160);
          return (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="flex flex-col gap-1 px-1 py-3 hover:bg-foreground/5"
              >
                <span className="text-sm font-medium">{note.title || "Untitled"}</span>
                {snippet && (
                  <span className="truncate text-xs text-foreground/50">{snippet}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
