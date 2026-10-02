import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";

// Anyone with the link can edit a shared note, but only its title and
// content — moving, deleting and (un)sharing stay owner-only.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Partial<{ title: string; content: unknown }> = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;

  const [note] = await db
    .update(notes)
    .set(updates)
    .where(and(eq(notes.id, id), eq(notes.isPublic, true)))
    .returning({ id: notes.id });

  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
