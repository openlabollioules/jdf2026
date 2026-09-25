import "server-only";
import { dayFolder, SHARE_PREFIX } from "./keys";

export interface SupabaseConfig {
  url: string;
  serviceKey: string;
  bucket: string;
}

function headers(cfg: SupabaseConfig, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${cfg.serviceKey}`, apikey: cfg.serviceKey, ...extra };
}

async function call<T>(cfg: SupabaseConfig, method: string, route: string, body: unknown): Promise<T> {
  const res = await fetch(`${cfg.url}/storage/v1/${route}`, {
    method,
    headers: headers(cfg, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${route.split("/", 2).join("/")} ${res.status}`);
  return (await res.json()) as T;
}

export async function uploadToSupabase(cfg: SupabaseConfig, key: string, bytes: Buffer, mime: string, ttlHours: number): Promise<string> {
  if (!cfg.url || !cfg.serviceKey) throw new Error("Supabase non configuré : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY manquant(s)");
  const res = await fetch(`${cfg.url}/storage/v1/object/${cfg.bucket}/${key}`, {
    method: "POST",
    headers: headers(cfg, { "Content-Type": mime, "Cache-Control": "3600", "x-upsert": "false" }),
    body: new Uint8Array(bytes),
  });
  if (!res.ok) throw new Error(`Supabase upload ${res.status} : ${(await res.text().catch(() => "")).slice(0, 300)}`);

  const { signedURL } = await call<{ signedURL: string }>(cfg, "POST", `object/sign/${cfg.bucket}/${key}`, {
    expiresIn: Math.round(ttlHours * 3600),
  });
  return `${cfg.url}/storage/v1${signedURL}`;
}

/** Supprime les dossiers journaliers entièrement expirés (drones/AAAA-MM-JJ/). */
export async function cleanupSupabase(cfg: SupabaseConfig, ttlHours: number): Promise<void> {
  if (!cfg.url || !cfg.serviceKey) return;
  // Un dossier du jour J contient des images créées au plus tard à J+1 00:00 UTC.
  const cutoff = dayFolder(new Date(Date.now() - ttlHours * 3600_000 - 24 * 3600_000));
  const folders = await call<{ name: string; id: string | null }[]>(cfg, "POST", `object/list/${cfg.bucket}`, {
    prefix: SHARE_PREFIX,
    limit: 1000,
    offset: 0,
  });
  for (const folder of folders) {
    if (folder.id !== null || !/^\d{4}-\d{2}-\d{2}$/.test(folder.name) || folder.name > cutoff) continue;
    const files = await call<{ name: string }[]>(cfg, "POST", `object/list/${cfg.bucket}`, {
      prefix: `${SHARE_PREFIX}${folder.name}/`,
      limit: 1000,
      offset: 0,
    });
    if (!files.length) continue;
    await call(cfg, "DELETE", `object/${cfg.bucket}`, {
      prefixes: files.map((f) => `${SHARE_PREFIX}${folder.name}/${f.name}`),
    });
  }
}
