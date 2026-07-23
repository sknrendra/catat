import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like, or } from "drizzle-orm";
import type { JSONContent } from "@tiptap/core";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { extractPlainText } from "@/lib/tiptap-text";

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);

  const pattern = `%${q}%`;
  const rows = await db
    .select({
      id: notes.id,
      notebookId: notes.notebookId,
      title: notes.title,
      content: notes.content,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        or(like(notes.title, pattern), like(notes.content, pattern)),
      ),
    )
    .orderBy(desc(notes.updatedAt))
    .limit(50);

  return NextResponse.json(
    rows.map(({ content, ...rest }) => ({
      ...rest,
      snippet: extractPlainText(content as JSONContent).slice(0, 160),
    })),
  );
}
