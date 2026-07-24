import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectMembers, projects } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      ownerId: projects.ownerId,
      role: projectMembers.role,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(desc(projects.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const [project] = await db
    .insert(projects)
    .values({ id: crypto.randomUUID(), ownerId: userId, name, description })
    .returning();

  await db.insert(projectMembers).values({
    id: crypto.randomUUID(),
    projectId: project.id,
    userId,
    role: "owner",
  });

  return NextResponse.json(project, { status: 201 });
}
