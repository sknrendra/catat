import { NextRequest, NextResponse } from "next/server";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { notebooks } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(notebooks)
    .where(eq(notebooks.userId, userId))
    .orderBy(asc(notebooks.sortOrder), desc(notebooks.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const [notebook] = await db
    .insert(notebooks)
    .values({ id: crypto.randomUUID(), userId, name })
    .returning();

  return NextResponse.json(notebook, { status: 201 });
}
