import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { backlogs, cycleBacklogs, cycles, projects } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(cycles)
    .where(and(eq(cycles.projectId, projectId), eq(cycles.userId, userId)))
    .orderBy(desc(cycles.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const plannedStartDate =
    typeof body.plannedStartDate === "string" && body.plannedStartDate
      ? new Date(body.plannedStartDate)
      : null;
  const plannedEndDate =
    typeof body.plannedEndDate === "string" && body.plannedEndDate
      ? new Date(body.plannedEndDate)
      : null;
  const backlogIds = Array.isArray(body.backlogIds)
    ? body.backlogIds.filter((id: unknown): id is string => typeof id === "string")
    : [];

  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const [openCycle] = await db
    .select({ id: cycles.id })
    .from(cycles)
    .where(
      and(
        eq(cycles.projectId, projectId),
        inArray(cycles.status, ["planned", "active"]),
      ),
    );
  if (openCycle) {
    return NextResponse.json({ error: "This project already has an open cycle" }, { status: 409 });
  }

  if (backlogIds.length > 0) {
    const ownedBacklogs = await db
      .select({ id: backlogs.id })
      .from(backlogs)
      .where(
        and(
          inArray(backlogs.id, backlogIds),
          eq(backlogs.projectId, projectId),
          eq(backlogs.userId, userId),
        ),
      );
    if (ownedBacklogs.length !== backlogIds.length) {
      return NextResponse.json({ error: "Some work items were not found" }, { status: 400 });
    }
  }

  const cycle = db.transaction((tx) => {
    const [created] = tx
      .insert(cycles)
      .values({
        id: crypto.randomUUID(),
        projectId,
        userId,
        description,
        plannedStartDate,
        plannedEndDate,
      })
      .returning()
      .all();

    if (backlogIds.length > 0) {
      tx.insert(cycleBacklogs)
        .values(
          backlogIds.map((backlogId: string) => ({
            id: crypto.randomUUID(),
            cycleId: created.id,
            backlogId,
          })),
        )
        .run();
    }

    return created;
  });

  return NextResponse.json(cycle, { status: 201 });
}
