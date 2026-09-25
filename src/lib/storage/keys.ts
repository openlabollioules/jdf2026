import { randomId } from "@/lib/server/ids";

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** Préfixe commun à tous les fournisseurs cloud (cible des règles de cycle de vie). */
export const SHARE_PREFIX = "drones/";

/** Dossier journalier (UTC) : permet de purger par jour entier. */
export function dayFolder(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Clé non devinable : drones/AAAA-MM-JJ/<32 caractères aléatoires>.<ext> */
export function shareKey(ext: string, date = new Date()): string {
  return `${SHARE_PREFIX}${dayFolder(date)}/${randomId(32)}.${ext}`;
}

export function contentDisposition(ext: string): string {
  return `inline; filename="mon-super-drone.${ext}"`;
}
