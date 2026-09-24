/**
 * Validation des images reçues du navigateur (data URL base64).
 * On vérifie le type déclaré ET la signature binaire réelle du fichier.
 */
export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

export interface DecodedImage {
  bytes: Buffer;
  mime: ImageMime;
}

export class ImageValidationError extends Error {}

const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/;

export function sniffMime(bytes: Uint8Array): ImageMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function decodeImageDataUrl(dataUrl: unknown, maxBytes: number): DecodedImage {
  if (typeof dataUrl !== "string") throw new ImageValidationError("image manquante");
  // Contrôle de taille avant décodage (base64 ≈ 4/3 de la taille binaire).
  if (dataUrl.length > Math.ceil((maxBytes * 4) / 3) + 64) throw new ImageValidationError("image trop lourde");
  const m = DATA_URL_RE.exec(dataUrl);
  if (!m) throw new ImageValidationError("format d'image non supporté");
  const bytes = Buffer.from(m[2]!, "base64");
  if (bytes.length === 0) throw new ImageValidationError("image vide");
  if (bytes.length > maxBytes) throw new ImageValidationError("image trop lourde");
  const sniffed = sniffMime(bytes);
  if (!sniffed || sniffed !== m[1]) throw new ImageValidationError("contenu d'image invalide");
  return { bytes, mime: sniffed };
}
