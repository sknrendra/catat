import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { issues, tasks } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";
import { isValidStatus } from "@/lib/status";

async function loadIssueForMember(id: string, userId: string) {
  const [issue] = await db.select().from(issues).where(eq(issues.id, id));
  if (!issue) return { issue: null, membership: null };
  const membership = await getProjectMembership(issue.projectId, userId);
  return { issue, membership };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { issue, membership } = await loadIssueForMember(id, userId);
  if (!issue || !membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const issueTasks = await db
    .select({ id: tasks.id, status: tasks.status })
    .from(tasks)
    .where(eq(tasks.issueId, id));

  const percentDone =
    issueTasks.length === 0
      ? null
      : Math.round((issueTasks.filter((t) => t.status === "done").length / issueTasks.length) * 100);

  return NextResponse.json({ ...issue, percentDone, taskCount: issueTasks.length });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { issue, membership } = await loadIssueForMember(id, userId);
  if (!issue || !membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updates: Partial<typeof issues.$inferInsert> = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    updates.title = title;
  }
  if (typeof body.description === "string" || body.description === null) {
    updates.description = typeof body.description === "string" ? body.description.trim() || null : null;
  }
  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.reporterId !== undefined) {
    const reporterMembership = await getProjectMembership(issue.projectId, body.reporterId);
    if (!reporterMembership) {
      return NextResponse.json({ error: "Reporter must be a project member" }, { status: 400 });
    }
    updates.reporterId = body.reporterId;
  }
  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null) {
      updates.assigneeId = null;
    } else {
      const assigneeMembership = await getProjectMembership(issue.projectId, body.assigneeId);
      if (!assigneeMembership) {
        return NextResponse.json({ error: "Assignee must be a project member" }, { status: 400 });
      }
      updates.assigneeId = body.assigneeId;
    }
  }
  if (body.workAreaId !== undefined) {
    updates.workAreaId = typeof body.workAreaId === "string" && body.workAreaId ? body.workAreaId : null;
  }
  if (body.cycleId !== undefined) {
    updates.cycleId = typeof body.cycleId === "string" && body.cycleId ? body.cycleId : null;
  }
  if (body.expectedStart !== undefined) {
    updates.expectedStart = body.expectedStart ? new Date(body.expectedStart) : null;
  }
  if (body.expectedEnd !== undefined) {
    updates.expectedEnd = body.expectedEnd ? new Date(body.expectedEnd) : null;
  }

  const [updated] = await db.update(issues).set(updates).where(eq(issues.id, id)).returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { issue, membership } = await loadIssueForMember(id, userId);
  if (!issue || !membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(issues).where(eq(issues.id, id));

  return NextResponse.json({ success: true });
}
