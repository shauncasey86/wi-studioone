import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Image storage (CLAUDE.md §3).
 *
 * Primary backend: Cloudflare R2 (S3-compatible) — used when the R2_* env vars
 * are all set. Files are uploaded to the bucket and served from R2_PUBLIC_URL.
 *
 * Fallback backend: a filesystem/volume store at UPLOAD_DIR, served by
 * app/api/media/[...key]. No credentials needed; on Railway point UPLOAD_DIR at
 * a mounted volume so uploads survive deploys.
 */
export const uploadDir = process.env.UPLOAD_DIR || "uploads";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

export function isAllowedImage(contentType: string): boolean {
  return contentType in EXT;
}

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

function r2Config(): R2Config | null {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL,
  } = process.env;
  if (
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET &&
    R2_PUBLIC_URL
  ) {
    return {
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET,
      publicUrl: R2_PUBLIC_URL.replace(/\/$/, ""),
    };
  }
  return null;
}

export function activeBackend(): "r2" | "filesystem" {
  return r2Config() ? "r2" : "filesystem";
}

export async function save(
  data: Buffer,
  contentType: string,
): Promise<{ key: string; url: string }> {
  if (!isAllowedImage(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }
  const key = `${crypto.randomUUID()}.${EXT[contentType]}`;

  const r2 = r2Config();
  if (r2) {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { key, url: `${r2.publicUrl}/${key}` };
  }

  // filesystem / volume fallback
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, key), data);
  return { key, url: `/api/media/${key}` };
}

// Only the filesystem backend serves through the app; R2 is served by its own
// public URL. Returns null for missing/invalid keys.
export async function read(
  key: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  if (key.includes("/") || key.includes("..") || key.includes("\\"))
    return null;
  const ext = key.split(".").pop()?.toLowerCase();
  const contentType =
    Object.entries(EXT).find(([, e]) => e === ext)?.[0] ||
    "application/octet-stream";
  try {
    const data = await fs.readFile(path.join(uploadDir, key));
    return { data, contentType };
  } catch {
    return null;
  }
}
