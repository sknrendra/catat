import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? "catat-attachments";

let bucketReady: Promise<void> | null = null;

export function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const exists = await minioClient.bucketExists(MINIO_BUCKET).catch(() => false);
      if (!exists) {
        await minioClient.makeBucket(MINIO_BUCKET);
      }
    })();
  }
  return bucketReady;
}
