import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attachments, notes } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { ensureBucket, minioClient, MINIO_BUCKET } from "@/lib/minio";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId } = await params;
  const [note] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  await ensureBucket();

  const attachmentId = crypto.randomUUID();
  const minioKey = `${noteId}/${attachmentId}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await minioClient.putObject(MINIO_BUCKET, minioKey, buffer, buffer.length, {
    "Content-Type": file.type || "application/octet-stream",
  });

  const [attachment] = await db
    .insert(attachments)
    .values({
      id: attachmentId,
      noteId,
      minioKey,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buffer.length,
    })
    .returning();

  return NextResponse.json({
    ...attachment,
    url: `/api/attachments/${attachment.id}`,
  });
}
