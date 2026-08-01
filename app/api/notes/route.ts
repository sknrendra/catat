import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notebooks, notes } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notebookId = request.nextUrl.searchParams.get("notebookId");
  if (!notebookId) {
    return NextResponse.json({ error: "notebookId is required" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: notes.id,
      notebookId: notes.notebookId,
      title: notes.title,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(eq(notes.notebookId, notebookId), eq(notes.userId, userId)))
    .orderBy(desc(notes.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  let notebookId = typeof body.notebookId === "string" ? body.notebookId : "";
  const title = typeof body.title === "string" ? body.title : "";

  if (notebookId) {
    const [notebook] = await db
      .select({ id: notebooks.id })
      .from(notebooks)
      .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, userId)));
    if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
  } else {
    // No notebook specified: file it under "General", creating that
    // notebook first if this user doesn't have one (e.g. it was renamed
    // or deleted since sign-up).
    const [general] = await db
      .select({ id: notebooks.id })
      .from(notebooks)
      .where(and(eq(notebooks.userId, userId), eq(notebooks.name, "General")));
    if (general) {
      notebookId = general.id;
    } else {
      const [created] = await db
        .insert(notebooks)
        .values({ id: crypto.randomUUID(), userId, name: "General" })
        .returning({ id: notebooks.id });
      notebookId = created.id;
    }
  }

  const [note] = await db
    .insert(notes)
    .values({
      id: crypto.randomUUID(),
      notebookId,
      userId,
      title,
      content: { type: "doc", content: [{ type: "paragraph" }] },
    })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
