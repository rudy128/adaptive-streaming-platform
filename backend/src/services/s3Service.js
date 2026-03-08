import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import s3 from '../config/s3.js';
import env from '../config/env.js';

const bucket = env.aws.bucket;

/**
 * Upload a file to S3.
 * @param {string} key    S3 object key (e.g. "videos/abc/original.mp4")
 * @param {string} filePath  Absolute local file path
 * @param {string} [contentType]  MIME type
 */
export async function uploadFile(key, filePath, contentType) {
  const fileStream = createReadStream(filePath);
  const { size } = await stat(filePath);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentLength: size,
      ContentType: contentType,
    }),
  );

  return getPublicUrl(key);
}

/**
 * Upload a buffer directly to S3.
 */
export async function uploadBuffer(key, buffer, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return getPublicUrl(key);
}

/**
 * Delete an object from S3.
 */
export async function deleteObject(key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/**
 * Generate a pre-signed GET URL (expires in 1h by default).
 */
export async function getPresignedUrl(key, expiresIn = 3600) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn },
  );
}

/**
 * Build a public URL for the given S3 key.
 */
export function getPublicUrl(key) {
  if (env.aws.publicUrl) {
    return `${env.aws.publicUrl}/${key}`;
  }
  return `https://${bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
}
