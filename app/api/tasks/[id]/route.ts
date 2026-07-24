import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";
import { isValidRecurrence, isValidStatus } from "@/lib/status";

async function loadTaskForMember(id: string, userId: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) return { task: null, membership: null };
  const membership = await getProjectMembership(task.projectId, userId);
  return { task, membership };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { task, membership } = await loadTaskForMember(id, userId);
  if (!task || !membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { task, membership } = await loadTaskForMember(id, userId);
  if (!task || !membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updates: Partial<typeof tasks.$inferInsert> = {};

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
  if (body.recurrence !== undefined) {
    if (!isValidRecurrence(body.recurrence)) {
      return NextResponse.json({ error: "Invalid recurrence" }, { status: 400 });
    }
    updates.recurrence = body.recurrence;
  }
  if (body.effortHours !== undefined) {
    updates.effortHours = typeof body.effortHours === "number" ? body.effortHours : null;
  }
  if (body.reporterId !== undefined) {
    const reporterMembership = await getProjectMembership(task.projectId, body.reporterId);
    if (!reporterMembership) {
      return NextResponse.json({ error: "Reporter must be a project member" }, { status: 400 });
    }
    updates.reporterId = body.reporterId;
  }
  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null) {
      updates.assigneeId = null;
    } else {
      const assigneeMembership = await getProjectMembership(task.projectId, body.assigneeId);
      if (!assigneeMembership) {
        return NextResponse.json({ error: "Assignee must be a project member" }, { status: 400 });
      }
      updates.assigneeId = body.assigneeId;
    }
  }
  if (body.cycleId !== undefined) {
    updates.cycleId = typeof body.cycleId === "string" && body.cycleId ? body.cycleId : null;
  }
  if (body.issueId !== undefined) {
    updates.issueId = typeof body.issueId === "string" && body.issueId ? body.issueId : null;
  }

  const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();

  // Recurring tasks regenerate their next occurrence the moment they're completed,
  // since there's no scheduler in this app to spawn them on a calendar cadence.
  const justCompleted = updates.status === "done" && task.status !== "done";
  if (justCompleted && task.recurrence !== "none") {
    await db.insert(tasks).values({
      id: crypto.randomUUID(),
      projectId: task.projectId,
      issueId: task.issueId,
      cycleId: null,
      title: task.title,
      description: task.description,
      reporterId: task.reporterId,
      assigneeId: task.assigneeId,
      status: "todo",
      effortHours: task.effortHours,
      recurrence: task.recurrence,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { task, membership } = await loadTaskForMember(id, userId);
  if (!task || !membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(tasks).where(eq(tasks.id, id));

  return NextResponse.json({ success: true });
}
