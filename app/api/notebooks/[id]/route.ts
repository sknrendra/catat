import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notebooks } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const [notebook] = await db
    .update(notebooks)
    .set({ name })
    .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
    .returning();

  if (!notebook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(notebook);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [existing] = await db
    .select({ name: notebooks.name })
    .from(notebooks)
    .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)));

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.name === "General") {
    // Notes created without an explicit notebook always land in "General"
    // (see POST /api/notes) — keeping one around means that always works.
    return NextResponse.json(
      { error: "The General notebook can't be deleted" },
      { status: 400 },
    );
  }

  await db.delete(notebooks).where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)));

  return NextResponse.json({ success: true });
}
