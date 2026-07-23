import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attachments, notes } from "@/lib/db/schema";
import { getUserId } from "@/lib/session";
import { minioClient, MINIO_BUCKET } from "@/lib/minio";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [attachment] = await db
    .select({
      id: attachments.id,
      minioKey: attachments.minioKey,
      mimeType: attachments.mimeType,
      fileName: attachments.fileName,
    })
    .from(attachments)
    .innerJoin(notes, eq(attachments.noteId, notes.id))
    .where(and(eq(attachments.id, id), eq(notes.userId, userId)));

  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const objectStream = await minioClient.getObject(MINIO_BUCKET, attachment.minioKey);

  return new NextResponse(Readable.toWeb(objectStream) as ReadableStream, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${attachment.fileName}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
