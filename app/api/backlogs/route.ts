import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { BACKLOG_LABELS, backlogs, projects } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: backlogs.id,
      projectId: backlogs.projectId,
      title: backlogs.title,
      status: backlogs.status,
      label: backlogs.label,
      createdAt: backlogs.createdAt,
      updatedAt: backlogs.updatedAt,
    })
    .from(backlogs)
    .where(and(eq(backlogs.projectId, projectId), eq(backlogs.userId, userId)))
    .orderBy(desc(backlogs.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  let projectId = typeof body.projectId === "string" ? body.projectId : "";
  const title = typeof body.title === "string" ? body.title : "";
  const label = BACKLOG_LABELS.includes(body.label) ? body.label : "task";
  const parentId = typeof body.parentId === "string" ? body.parentId : null;

  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  if (parentId) {
    const [parent] = await db
      .select({ id: backlogs.id, projectId: backlogs.projectId, parentId: backlogs.parentId })
      .from(backlogs)
      .where(and(eq(backlogs.id, parentId), eq(backlogs.userId, userId)));
    if (!parent) return NextResponse.json({ error: "Parent work item not found" }, { status: 404 });
    if (parent.parentId) {
      return NextResponse.json(
        { error: "Cannot nest a work item more than one level deep" },
        { status: 400 },
      );
    }
    projectId = parent.projectId;
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const content = body.content !== undefined ? body.content : { type: "doc", content: [{ type: "paragraph" }] };

  const [backlog] = await db
    .insert(backlogs)
    .values({
      id: crypto.randomUUID(),
      projectId,
      userId,
      parentId,
      title,
      label,
      content,
    })
    .returning();

  return NextResponse.json(backlog, { status: 201 });
}
