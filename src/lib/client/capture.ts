"use client";

import { fitAspect, GUIDE_SCALE, outputSize, rotatedSize } from "./geometry";

export interface CaptureOptions {
  rotation: 0 | 90 | 180 | 270;
  aspect: number;
  maxSize: number;
}

/** Budget de poids : Replicate recommande les data URI sous 1 Mo. */
const MAX_BYTES = 900 * 1024;

/**
 * Capture la zone du guide de cadrage dans une frame vidéo :
 * rotation éventuelle, recadrage centré au ratio de génération, réduction de taille,
 * encodage JPEG de qualité raisonnable. Aucun filtre agressif : les traits du feutre
 * sont conservés tels quels. L'image n'est jamais en miroir.
 */
export function captureFrame(video: HTMLVideoElement, opts: CaptureOptions): string {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error("video not ready");

  const rot = rotatedSize({ w: vw, h: vh }, opts.rotation);
  const crop = fitAspect(opts.aspect, rot, GUIDE_SCALE);
  const out = outputSize(crop, opts.maxSize);

  const canvas = document.createElement("canvas");
  canvas.width = out.w;
  canvas.height = out.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.imageSmoothingQuality = "high";

  const scale = out.w / crop.w;
  ctx.scale(scale, scale);
  ctx.translate(-crop.x, -crop.y);
  // Rotation de la frame complète dans le repère « tourné ».
  ctx.translate(rot.w / 2, rot.h / 2);
  ctx.rotate((opts.rotation * Math.PI) / 180);
  ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);

  return encodeWithinBudget(canvas);
}

export function encodeWithinBudget(canvas: HTMLCanvasElement, maxBytes = MAX_BYTES): string {
  let quality = 0.9;
  let url = canvas.toDataURL("image/jpeg", quality);
  while (url.length * 0.75 > maxBytes && quality > 0.5) {
    quality -= 0.1;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  return url;
}

/** Convertit n'importe quelle image (fichier local, SVG d'exemple) en JPEG recadré (outils de dev). */
export async function imageUrlToCapture(src: string, opts: { aspect: number; maxSize: number }): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const w = img.naturalWidth || 1200;
  const h = img.naturalHeight || 900;
  const crop = fitAspect(opts.aspect, { w, h });
  const out = outputSize(crop, opts.maxSize);
  const canvas = document.createElement("canvas");
  canvas.width = out.w;
  canvas.height = out.h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.w, out.h);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, out.w, out.h);
  return encodeWithinBudget(canvas);
}
