import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { ensureBucket, minioClient, MINIO_BUCKET } from "@/lib/minio";

/** Stores an uploaded file in MinIO and records it against the note. */
export async function uploadAttachment(noteId: string, file: File) {
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

  return { ...attachment, url: `/api/attachments/${attachment.id}` };
}
