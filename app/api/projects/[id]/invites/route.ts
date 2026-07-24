import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectInvites, projectMembers, projects, user } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";
import { resend } from "@/lib/resend";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getProjectMembership(id, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can invite members" }, { status: 403 });
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const [invitee] = await db.select().from(user).where(eq(user.email, email));
  if (!invitee) {
    return NextResponse.json(
      { error: "No Catat account found with that email. Ask them to sign up first." },
      { status: 404 },
    );
  }

  const existing = await getProjectMembership(id, invitee.id);
  if (existing) {
    return NextResponse.json({ error: "That person is already a member" }, { status: 400 });
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, id));

  const [member] = await db
    .insert(projectMembers)
    .values({ id: crypto.randomUUID(), projectId: id, userId: invitee.id, role: "member" })
    .returning();

  await db.insert(projectInvites).values({
    id: crypto.randomUUID(),
    projectId: id,
    email,
    invitedByUserId: userId,
    status: "accepted",
  });

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: `You've been added to "${project.name}" on Catat`,
    html: `<p>You've been added as a member of the project "${project.name}" on Catat.</p><p><a href="${process.env.BETTER_AUTH_URL}/projects/${id}">Open the project</a></p>`,
  });
  if (error) console.error("Failed to send project invite email:", error);

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getProjectMembership(id, userId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can remove members" }, { status: 403 });
  }

  const targetUserId = request.nextUrl.searchParams.get("userId");
  if (!targetUserId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const target = await getProjectMembership(id, targetUserId);
  if (target?.role === "owner") {
    return NextResponse.json({ error: "Can't remove the project owner" }, { status: 400 });
  }

  await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, targetUserId)));

  return NextResponse.json({ success: true });
}
