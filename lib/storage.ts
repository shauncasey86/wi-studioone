import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Image storage (CLAUDE.md §3). This is the documented fallback backend: a
 * persistent-volume / filesystem store, served by app/api/media/[...key].
 * It needs no external credentials, so it works locally and on a Railway volume.
 *
 * The recommended production backend is Cloudflare R2 via @aws-sdk/client-s3;
 * it slots in behind this same { save } interface once R2_* env + creds exist
 * (return the R2 public URL instead of the local /api/media/ URL).
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

export async function save(
  data: Buffer,
  contentType: string,
): Promise<{ key: string; url: string }> {
  if (!isAllowedImage(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }
  const key = `${crypto.randomUUID()}.${EXT[contentType]}`;
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, key), data);
  return { key, url: `/api/media/${key}` };
}

export async function read(
  key: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  // Guard against path traversal — keys are flat filenames only.
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
