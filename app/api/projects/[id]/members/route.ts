import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectMembers, user } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getProjectMembership(id, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select({
      id: projectMembers.id,
      userId: projectMembers.userId,
      role: projectMembers.role,
      name: user.name,
      email: user.email,
    })
    .from(projectMembers)
    .innerJoin(user, eq(projectMembers.userId, user.id))
    .where(eq(projectMembers.projectId, id));

  return NextResponse.json(rows);
}
