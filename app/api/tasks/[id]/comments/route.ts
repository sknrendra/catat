import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { taskComments, tasks, user } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const membership = await getProjectMembership(task.projectId, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select({
      id: taskComments.id,
      body: taskComments.body,
      createdAt: taskComments.createdAt,
      authorId: taskComments.authorId,
      authorName: user.name,
    })
    .from(taskComments)
    .innerJoin(user, eq(taskComments.authorId, user.id))
    .where(eq(taskComments.taskId, id))
    .orderBy(asc(taskComments.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const membership = await getProjectMembership(task.projectId, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });

  const [comment] = await db
    .insert(taskComments)
    .values({ id: crypto.randomUUID(), taskId: id, authorId: userId, body: text })
    .returning();

  return NextResponse.json(comment, { status: 201 });
}
