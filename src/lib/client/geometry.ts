/** Calculs géométriques purs pour la capture webcam (testables sans navigateur). */
export interface Size {
  w: number;
  h: number;
}
export interface Rect extends Size {
  x: number;
  y: number;
}

/** Plus grand rectangle de ratio `aspect` (l/h) contenu dans `box`, centré, réduit de `scale`. */
export function fitAspect(aspect: number, box: Size, scale = 1): Rect {
  let w = box.w;
  let h = w / aspect;
  if (h > box.h) {
    h = box.h;
    w = h * aspect;
  }
  w *= scale;
  h *= scale;
  return { x: (box.w - w) / 2, y: (box.h - h) / 2, w, h };
}

/** Dimensions du flux après rotation logicielle (90/270 intervertissent largeur et hauteur). */
export function rotatedSize(size: Size, rotation: 0 | 90 | 180 | 270): Size {
  return rotation === 90 || rotation === 270 ? { w: size.h, h: size.w } : size;
}

/** Taille de sortie limitée à `maxSize` sur le grand côté (jamais d'agrandissement). */
export function outputSize(crop: Size, maxSize: number): Size {
  const ratio = Math.min(1, maxSize / Math.max(crop.w, crop.h));
  return { w: Math.max(1, Math.round(crop.w * ratio)), h: Math.max(1, Math.round(crop.h * ratio)) };
}

/** Part du cadre vidéo occupée par le guide de cadrage (partagée entre l'affichage et la capture). */
export const GUIDE_SCALE = 0.9;
