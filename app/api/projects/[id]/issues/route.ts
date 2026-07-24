import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { issues } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";
import { isValidStatus } from "@/lib/status";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getProjectMembership(id, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cycleId = request.nextUrl.searchParams.get("cycleId");
  const conditions = [eq(issues.projectId, id)];
  if (cycleId === "backlog") conditions.push(isNull(issues.cycleId));
  else if (cycleId) conditions.push(eq(issues.cycleId, cycleId));

  const rows = await db
    .select()
    .from(issues)
    .where(and(...conditions))
    .orderBy(desc(issues.createdAt));

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

  const [issue] = await db
    .insert(issues)
    .values({
      id: crypto.randomUUID(),
      projectId: id,
      title,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      reporterId,
      assigneeId,
      status,
      workAreaId: typeof body.workAreaId === "string" && body.workAreaId ? body.workAreaId : null,
      cycleId: typeof body.cycleId === "string" && body.cycleId ? body.cycleId : null,
      expectedStart: body.expectedStart ? new Date(body.expectedStart) : null,
      expectedEnd: body.expectedEnd ? new Date(body.expectedEnd) : null,
    })
    .returning();

  return NextResponse.json(issue, { status: 201 });
}
