import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";
import { isValidRecurrence, isValidStatus } from "@/lib/status";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getProjectMembership(id, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cycleId = request.nextUrl.searchParams.get("cycleId");
  const issueId = request.nextUrl.searchParams.get("issueId");
  const conditions = [eq(tasks.projectId, id)];
  if (cycleId === "backlog") conditions.push(isNull(tasks.cycleId));
  else if (cycleId) conditions.push(eq(tasks.cycleId, cycleId));
  if (issueId) conditions.push(eq(tasks.issueId, issueId));

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getProjectMembership(id, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  let reporterId = userId;
  if (typeof body.reporterId === "string" && body.reporterId !== userId) {
    const reporterMembership = await getProjectMembership(id, body.reporterId);
    if (!reporterMembership) {
      return NextResponse.json({ error: "Reporter must be a project member" }, { status: 400 });
    }
    reporterId = body.reporterId;
  }

  let assigneeId: string | null = null;
  if (typeof body.assigneeId === "string" && body.assigneeId) {
    const assigneeMembership = await getProjectMembership(id, body.assigneeId);
    if (!assigneeMembership) {
      return NextResponse.json({ error: "Assignee must be a project member" }, { status: 400 });
    }
    assigneeId = body.assigneeId;
  }

  const status = isValidStatus(body.status) ? body.status : "todo";
  const recurrence = isValidRecurrence(body.recurrence) ? body.recurrence : "none";

  const [task] = await db
    .insert(tasks)
    .values({
      id: crypto.randomUUID(),
      projectId: id,
      title,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      reporterId,
      assigneeId,
      status,
      issueId: typeof body.issueId === "string" && body.issueId ? body.issueId : null,
      cycleId: typeof body.cycleId === "string" && body.cycleId ? body.cycleId : null,
      effortHours: typeof body.effortHours === "number" ? body.effortHours : null,
      recurrence,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
