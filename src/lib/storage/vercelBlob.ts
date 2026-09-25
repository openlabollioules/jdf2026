import "server-only";
import { del, list, put } from "@vercel/blob";
import { SHARE_PREFIX } from "./keys";

export interface VercelBlobConfig {
  token: string;
}

export async function uploadToVercelBlob(cfg: VercelBlobConfig, key: string, bytes: Buffer, mime: string): Promise<string> {
  if (!cfg.token) throw new Error("Vercel Blob non configuré : BLOB_READ_WRITE_TOKEN manquant");
  const blob = await put(key, bytes, { access: "public", token: cfg.token, contentType: mime, addRandomSuffix: false });
  return blob.url;
}

export async function cleanupVercelBlob(cfg: VercelBlobConfig, ttlHours: number): Promise<void> {
  if (!cfg.token) return;
  const limit = Date.now() - ttlHours * 3600_000;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: SHARE_PREFIX, limit: 1000, cursor, token: cfg.token });
    const expired = page.blobs.filter((b) => new Date(b.uploadedAt).getTime() <= limit).map((b) => b.url);
    if (expired.length) await del(expired, { token: cfg.token });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
