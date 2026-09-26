import "server-only";
import { AwsClient } from "aws4fetch";
import { contentDisposition } from "./keys";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Domaine public du bucket (r2.dev ou personnalisé). Vide : bucket privé + URL pré-signée. */
  publicUrl: string;
}

/** Durée maximale d'une URL pré-signée S3/R2 : 7 jours. */
const MAX_PRESIGN_SECONDS = 7 * 24 * 3600;

function assertConfigured(cfg: R2Config) {
  const missing = (
    [
      ["R2_ACCOUNT_ID", cfg.accountId],
      ["R2_ACCESS_KEY_ID", cfg.accessKeyId],
      ["R2_SECRET_ACCESS_KEY", cfg.secretAccessKey],
      ["R2_BUCKET", cfg.bucket],
    ] as const
  )
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) throw new Error(`R2 non configuré : ${missing.join(", ")} manquant(s)`);
}

function client(cfg: R2Config) {
  // Peu de nouvelles tentatives : le navigateur relance lui-même la demande de partage.
  return new AwsClient({
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    service: "s3",
    region: "auto",
    retries: 2,
  });
}

export function r2ObjectUrl(cfg: Pick<R2Config, "accountId" | "bucket">, key: string): string {
  return `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}/${key}`;
}

/** URL GET pré-signée (bucket privé), valable `ttlHours` (7 jours maximum). */
export async function presignR2Get(cfg: R2Config, key: string, ttlHours: number): Promise<string> {
  const seconds = Math.min(MAX_PRESIGN_SECONDS, Math.max(60, Math.round(ttlHours * 3600)));
  const signed = await client(cfg).sign(`${r2ObjectUrl(cfg, key)}?X-Amz-Expires=${seconds}`, {
    method: "GET",
    aws: { signQuery: true },
  });
  return signed.url;
}

export async function uploadToR2(cfg: R2Config, key: string, bytes: Buffer, mime: string, ttlHours: number): Promise<string> {
  assertConfigured(cfg);
  const ext = key.split(".").pop()!;
  const res = await client(cfg).fetch(r2ObjectUrl(cfg, key), {
    method: "PUT",
    body: new Uint8Array(bytes),
    headers: {
      "Content-Type": mime,
      "Content-Length": String(bytes.length),
      "Content-Disposition": contentDisposition(ext),
      "Cache-Control": "public, max-age=86400",
    },
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`R2 PUT ${res.status} : ${detail}`);
  }
  return cfg.publicUrl ? `${cfg.publicUrl}/${key}` : presignR2Get(cfg, key, ttlHours);
}
