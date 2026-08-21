import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

// Storage abstraction: writes to the local Docker volume by default (STORAGE_MODE unset or 'local'),
// or to MinIO (S3-compatible) when STORAGE_MODE=minio. Both are swappable behind the same interface
// so the rest of the app never depends on where files physically live.

let minioClient = null;
async function getMinioClient() {
  if (minioClient) return minioClient;
  const { Client } = await import('minio');
  minioClient = new Client({
    endPoint: env.storage.endpoint,
    port: env.storage.port,
    useSSL: env.storage.useSSL,
    accessKey: env.storage.accessKey,
    secretKey: env.storage.secretKey,
  });
  const exists = await minioClient.bucketExists(env.storage.bucket).catch(() => false);
  if (!exists) {
    await minioClient.makeBucket(env.storage.bucket);
  }
  return minioClient;
}

function buildFilename(originalName) {
  const ext = path.extname(originalName || '').toLowerCase() || '.jpg';
  return `${randomUUID()}${ext}`;
}

export async function saveImage(file) {
  const filename = buildFilename(file.originalname);

  if (env.storage.localFallback) {
    const destPath = path.join(env.storage.localDir, filename);
    await fs.promises.writeFile(destPath, file.buffer);
    return `/uploads/${filename}`;
  }

  const client = await getMinioClient();
  await client.putObject(env.storage.bucket, filename, file.buffer, file.size, {
    'Content-Type': file.mimetype,
  });
  return `${env.storage.publicUrl}/${filename}`;
}

export async function deleteImage(url) {
  const filename = url.split('/').pop();
  if (!filename) return;

  if (env.storage.localFallback) {
    const filePath = path.join(env.storage.localDir, filename);
    await fs.promises.unlink(filePath).catch(() => {});
    return;
  }

  const client = await getMinioClient();
  await client.removeObject(env.storage.bucket, filename).catch(() => {});
}
