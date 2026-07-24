import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cycles } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [existing] = await db.select().from(cycles).where(eq(cycles.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await getProjectMembership(existing.projectId, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updates: { name?: string | null; startedAt?: Date; endsAt?: Date } = {};
  if (typeof body.name === "string" || body.name === null) {
    updates.name = typeof body.name === "string" ? body.name.trim() || null : null;
  }
  if (body.startedAt) updates.startedAt = new Date(body.startedAt);
  if (body.endsAt) updates.endsAt = new Date(body.endsAt);

  const [cycle] = await db.update(cycles).set(updates).where(eq(cycles.id, id)).returning();

  return NextResponse.json(cycle);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [existing] = await db.select().from(cycles).where(eq(cycles.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await getProjectMembership(existing.projectId, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(cycles).where(eq(cycles.id, id));

  return NextResponse.json({ success: true });
}
