import type { ScenePhase } from "@/lib/scene/sceneMachine";

/**
 * Géométrie de la scène (unités SVG). Le « monde » est une grande colonne d'eau
 * de 1600 × 2500 ; la caméra (viewport 16:9 de 1600 × 900) descend et remonte.
 */
export const VIEW = { w: 1600, h: 900 };
export const WORLD = { w: 1600, h: 2500 };
export const SURFACE_Y = 260;
export const SEABED_Y = 2330;
export const CAMERA_LAB_Y = 1600;

export const SUB_AT_SURFACE = { x: 600, y: 292 };
export const SUB_AT_LAB = { x: 560, y: 2150 };
export const SUB_REVEAL = { x: 880, y: 280 };
export const LAB_HATCH = { x: 880, y: 2200 };

export interface SubPose {
  x: number;
  y: number;
  tilt: number;
  /** Direction du regard (décalage des pupilles). */
  look: { x: number; y: number };
}

export function cameraY(phase: ScenePhase): number {
  return phase === "diving" || phase === "laboratory" || phase === "waiting" || phase === "result-ready" ? CAMERA_LAB_Y : 0;
}

export function subPose(phase: ScenePhase): SubPose {
  switch (phase) {
    case "starting":
      return { ...SUB_AT_SURFACE, tilt: 0, look: { x: -4, y: 6 } };
    case "diving":
      return { ...SUB_AT_LAB, tilt: 16, look: { x: 8, y: 8 } };
    case "laboratory":
    case "waiting":
      return { ...SUB_AT_LAB, tilt: 0, look: { x: 9, y: 0 } };
    case "result-ready":
      return { ...SUB_AT_LAB, tilt: -4, look: { x: 9, y: 5 } };
    case "surfacing":
      return { x: SUB_REVEAL.x, y: SUB_REVEAL.y + 20, tilt: -18, look: { x: 5, y: -9 } };
    case "reveal":
    case "done":
      return { ...SUB_REVEAL, tilt: 0, look: { x: -4, y: 6 } };
  }
}
