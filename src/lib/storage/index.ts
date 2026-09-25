import "server-only";
import { getServerConfig } from "@/lib/server/env";
import { logEvent } from "@/lib/server/metrics";
import { writeLocalFile, cleanupLocalFiles } from "./local";
import { uploadToR2 } from "./r2";
import { uploadToSupabase, cleanupSupabase } from "./supabase";
import { uploadToVercelBlob, cleanupVercelBlob } from "./vercelBlob";
import { shareKey, EXT_BY_MIME } from "./keys";

export interface ShareResult {
  url: string;
  expiresAt: number;
}

const CLEANUP_EVERY_MS = 60 * 60 * 1000;
const g = globalThis as unknown as { __droneStorageCleanupAt?: number };

/** Nettoyage des images expirées, au plus 1×/h, sans bloquer l'upload. */
function scheduleCleanup(run: () => Promise<void>) {
  const now = Date.now();
  if ((g.__droneStorageCleanupAt ?? 0) + CLEANUP_EVERY_MS > now) return;
  g.__droneStorageCleanupAt = now;
  run().catch((err) => logEvent("storage_cleanup_failed", { message: String(err).slice(0, 200) }));
}

function isLoopback(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "[::1]" || host.startsWith("127.");
  } catch {
    return true;
  }
}

/**
 * Dépose l'image finale sur le stockage configuré (STORAGE_PROVIDER) et renvoie
 * l'URL encodée dans le QR code.
 * - `null` : aucun lien possible avec cette configuration (définitif).
 * - exception : échec transitoire ou configuration incomplète (un nouvel essai reste possible).
 */
export async function uploadShareImage(bytes: Buffer, mime: string, origin: string): Promise<ShareResult | null> {
  const cfg = getServerConfig().storage;
  const ext = EXT_BY_MIME[mime];
  if (!ext) throw new Error(`type d'image non pris en charge : ${mime}`);
  const ttlMs = cfg.ttlHours * 3600_000;
  const expiresAt = Date.now() + ttlMs;

  switch (cfg.provider) {
    case "none":
      return null;

    case "local": {
      // Le téléphone du parent doit pouvoir joindre la borne : « localhost » ne convient pas.
      const base = cfg.publicBaseUrl || (isLoopback(origin) ? "" : origin);
      if (!base) return null;
      const name = await writeLocalFile(cfg.localDir, bytes, ext);
      scheduleCleanup(() => cleanupLocalFiles(cfg.localDir, cfg.ttlHours));
      return { url: `${base}/api/files/${name}`, expiresAt };
    }

    case "r2": {
      const url = await uploadToR2(cfg.r2, shareKey(ext), bytes, mime, cfg.ttlHours);
      // Suppression : règle de cycle de vie du bucket (préfixe drones/), voir README §7.
      return { url, expiresAt };
    }

    case "supabase": {
      const url = await uploadToSupabase(cfg.supabase, shareKey(ext), bytes, mime, cfg.ttlHours);
      scheduleCleanup(() => cleanupSupabase(cfg.supabase, cfg.ttlHours));
      return { url, expiresAt };
    }

    case "vercel-blob": {
      const url = await uploadToVercelBlob(cfg.vercelBlob, shareKey(ext), bytes, mime);
      scheduleCleanup(() => cleanupVercelBlob(cfg.vercelBlob, cfg.ttlHours));
      return { url, expiresAt };
    }

    default:
      throw new Error(`STORAGE_PROVIDER inconnu : ${String(cfg.provider)}`);
  }
}
