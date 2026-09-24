import { generationStore } from "@/lib/generation/store";
import { getServerConfig } from "@/lib/server/env";
import { json, readJsonBody, requestOrigin } from "@/lib/server/http";
import { ID_RE } from "@/lib/server/ids";
import { decodeImageDataUrl } from "@/lib/server/image";
import { logEvent } from "@/lib/server/metrics";
import { uploadShareImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Reçoit la composition finale (cadre + titre, dessinée par le navigateur),
 * la conserve pour l'e-mail et la dépose sur le stockage cloud pour le QR code.
 * Sans composition valide, l'image brute générée est utilisée.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cfg = getServerConfig();
  const { id } = await params;
  const rec = ID_RE.test(id) ? generationStore.get(id) : undefined;
  if (!rec || rec.status !== "succeeded" || !rec.result) return json({ error: "not_found" }, 404);

  if (rec.share) return json({ shareUrl: rec.share.url, expiresAt: rec.share.expiresAt });
  if (rec.shareUnavailable) return json({ shareUrl: null, reason: "unavailable" });

  if (!rec.sharePromise) {
    const body = await readJsonBody<{ image?: unknown }>(req, Math.ceil(cfg.limits.maxUploadBytes * 1.4) + 1024);
    if (body?.image && !rec.final) {
      try {
        rec.final = decodeImageDataUrl(body.image, cfg.limits.maxUploadBytes);
      } catch {
        /* composition invalide : on garde l'image brute */
      }
    }
    const img = rec.final ?? rec.result;
    const origin = requestOrigin(req);
    rec.sharePromise = uploadShareImage(img.bytes, img.mime, origin)
      .then((r) => {
        rec.share = r;
        // null = aucun lien possible avec la configuration actuelle (pas de stockage, adresse non joignable).
        rec.shareUnavailable = r === null;
        logEvent("share_uploaded", { id: rec.id, ok: !!r });
        return r;
      })
      .catch((err) => {
        logEvent("share_failed", { id: rec.id, message: String(err).slice(0, 200) });
        rec.sharePromise = null; // un nouvel essai reste possible
        return null;
      });
  }

  const share = await rec.sharePromise;
  if (share) return json({ shareUrl: share.url, expiresAt: share.expiresAt });
  return json({ shareUrl: null, reason: rec.shareUnavailable ? "unavailable" : "failed" });
}
