import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attachments, notes } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { minioClient, MINIO_BUCKET } from "@/lib/minio";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();

  const { id } = await params;
  const [attachment] = await db
    .select({
      id: attachments.id,
      minioKey: attachments.minioKey,
      mimeType: attachments.mimeType,
      fileName: attachments.fileName,
      noteUserId: notes.userId,
      noteIsPublic: notes.isPublic,
    })
    .from(attachments)
    .innerJoin(notes, eq(attachments.noteId, notes.id))
    .where(eq(attachments.id, id));

  // Readable by the note's owner, or by anyone if the note is shared.
  if (!attachment || (attachment.noteUserId !== userId && !attachment.noteIsPublic)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const objectStream = await minioClient.getObject(MINIO_BUCKET, attachment.minioKey);

  return new NextResponse(Readable.toWeb(objectStream) as ReadableStream, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${attachment.fileName}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
