import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notebooks, projects } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";

// Turns a notebook into a project: a new project named after the notebook
// takes ownership of it, so its notes become the project's notes.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [notebook] = await db
    .select()
    .from(notebooks)
    .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)));

  if (!notebook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (notebook.projectId) {
    return NextResponse.json({ error: "Notebook already belongs to a project" }, { status: 400 });
  }
  if (notebook.name === "General") {
    // See DELETE /api/notebooks/[id] — "General" must stay a notebook.
    return NextResponse.json(
      { error: "The General notebook can't be converted" },
      { status: 400 },
    );
  }

  const project = db.transaction((tx) => {
    const [created] = tx
      .insert(projects)
      .values({ id: crypto.randomUUID(), userId, title: notebook.name })
      .returning()
      .all();

    tx.update(notebooks).set({ projectId: created.id }).where(eq(notebooks.id, notebook.id)).run();

    return created;
  });

  return NextResponse.json(project, { status: 201 });
}
