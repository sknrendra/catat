import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workAreas } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [existing] = await db.select().from(workAreas).where(eq(workAreas.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await getProjectMembership(existing.projectId, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updates: { name?: string; color?: string; sortOrder?: number } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    updates.name = name;
  }
  if (typeof body.color === "string" && body.color.trim()) updates.color = body.color.trim();
  if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;

  const [workArea] = await db
    .update(workAreas)
    .set(updates)
    .where(eq(workAreas.id, id))
    .returning();

  return NextResponse.json(workArea);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [existing] = await db.select().from(workAreas).where(eq(workAreas.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await getProjectMembership(existing.projectId, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(workAreas).where(eq(workAreas.id, id));

  return NextResponse.json({ success: true });
}
