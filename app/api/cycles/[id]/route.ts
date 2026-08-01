import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { CYCLE_STATUSES, cycles } from "@/lib/db/schema";

import { getUserId } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [cycle] = await db
    .select()
    .from(cycles)
    .where(and(eq(cycles.id, id), eq(cycles.userId, userId)));

  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cycle);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [existing] = await db
    .select()
    .from(cycles)
    .where(and(eq(cycles.id, id), eq(cycles.userId, userId)));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Partial<{
    description: string;
    plannedStartDate: Date | null;
    plannedEndDate: Date | null;
    status: (typeof CYCLE_STATUSES)[number];
    startedAt: Date;
    endedAt: Date;
  }> = {};

  if (typeof body.description === "string") updates.description = body.description;
  if (body.plannedStartDate !== undefined) {
    updates.plannedStartDate = body.plannedStartDate ? new Date(body.plannedStartDate) : null;
  }
  if (body.plannedEndDate !== undefined) {
    updates.plannedEndDate = body.plannedEndDate ? new Date(body.plannedEndDate) : null;
  }

  if (CYCLE_STATUSES.includes(body.status)) {
    if (body.status === "active") {
      if (existing.status !== "planned") {
        return NextResponse.json({ error: "Only a planned cycle can be started" }, { status: 400 });
      }
      const [activeCycle] = await db
        .select({ id: cycles.id })
        .from(cycles)
        .where(
          and(
            eq(cycles.projectId, existing.projectId),
            eq(cycles.status, "active"),
            ne(cycles.id, id),
          ),
        );
      if (activeCycle) {
        return NextResponse.json(
          { error: "This project already has an active cycle" },
          { status: 409 },
        );
      }
      updates.status = "active";
      updates.startedAt = new Date();
    } else if (body.status === "completed") {
      if (existing.status !== "active") {
        return NextResponse.json({ error: "Only an active cycle can be ended" }, { status: 400 });
      }
      updates.status = "completed";
      updates.endedAt = new Date();
    } else if (body.status === "planned") {
      return NextResponse.json({ error: "Cannot revert a cycle to planned" }, { status: 400 });
    }
  }

  const [cycle] = await db
    .update(cycles)
    .set(updates)
    .where(and(eq(cycles.id, id), eq(cycles.userId, userId)))
    .returning();

  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cycle);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [cycle] = await db
    .delete(cycles)
    .where(and(eq(cycles.id, id), eq(cycles.userId, userId)))
    .returning();

  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
