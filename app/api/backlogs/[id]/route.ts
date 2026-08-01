import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { BACKLOG_LABELS, BACKLOG_STATUSES, backlogs, projects } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [backlog] = await db
    .select()
    .from(backlogs)
    .where(and(eq(backlogs.id, id), eq(backlogs.userId, userId)));

  if (!backlog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(backlog);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updates: Partial<{
    title: string;
    content: unknown;
    status: (typeof BACKLOG_STATUSES)[number];
    label: (typeof BACKLOG_LABELS)[number];
    projectId: string;
  }> = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (BACKLOG_STATUSES.includes(body.status)) updates.status = body.status;
  if (BACKLOG_LABELS.includes(body.label)) updates.label = body.label;
  if (typeof body.projectId === "string") {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, body.projectId), eq(projects.userId, userId)));
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    updates.projectId = body.projectId;
  }

  const [backlog] = await db
    .update(backlogs)
    .set(updates)
    .where(and(eq(backlogs.id, id), eq(backlogs.userId, userId)))
    .returning();

  if (!backlog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(backlog);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [backlog] = await db
    .delete(backlogs)
    .where(and(eq(backlogs.id, id), eq(backlogs.userId, userId)))
    .returning();

  if (!backlog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
