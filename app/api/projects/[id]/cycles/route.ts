import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cycles } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getProjectMembership(id, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select()
    .from(cycles)
    .where(eq(cycles.projectId, id))
    .orderBy(desc(cycles.startedAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getProjectMembership(id, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
  const durationDays = typeof body.durationDays === "number" && body.durationDays > 0 ? body.durationDays : 7;
  const endsAt = body.endsAt ? new Date(body.endsAt) : new Date(startedAt.getTime() + durationDays * DAY_MS);
  const name = typeof body.name === "string" ? body.name.trim() || null : null;

  const [cycle] = await db
    .insert(cycles)
    .values({ id: crypto.randomUUID(), projectId: id, name, startedAt, endsAt })
    .returning();

  return NextResponse.json(cycle, { status: 201 });
}
