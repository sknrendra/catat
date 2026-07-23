import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notebooks } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

export async function PATCH(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const orderedIds = body.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "orderedIds must be a string array" }, { status: 400 });
  }

  await Promise.all(
    orderedIds.map((id: string, index: number) =>
      db
        .update(notebooks)
        .set({ sortOrder: index })
        .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId))),
    ),
  );

  return NextResponse.json({ success: true });
}
