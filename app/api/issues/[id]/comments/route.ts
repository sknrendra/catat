import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { issueComments, issues, user } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [issue] = await db.select().from(issues).where(eq(issues.id, id));
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const membership = await getProjectMembership(issue.projectId, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select({
      id: issueComments.id,
      body: issueComments.body,
      createdAt: issueComments.createdAt,
      authorId: issueComments.authorId,
      authorName: user.name,
    })
    .from(issueComments)
    .innerJoin(user, eq(issueComments.authorId, user.id))
    .where(eq(issueComments.issueId, id))
    .orderBy(asc(issueComments.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [issue] = await db.select().from(issues).where(eq(issues.id, id));
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const membership = await getProjectMembership(issue.projectId, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });

  const [comment] = await db
    .insert(issueComments)
    .values({ id: crypto.randomUUID(), issueId: id, authorId: userId, body: text })
    .returning();

  return NextResponse.json(comment, { status: 201 });
}
