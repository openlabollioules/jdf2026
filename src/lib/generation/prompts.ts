import { describeChoices, type DroneChoices } from "@/config/choices";

/**
 * Construction du prompt image (toujours côté serveur).
 *
 * Principe fondamental : le dessin de l'enfant reste la source de la forme du drone.
 * Le prompt demande donc une *transformation* du croquis fourni en image de référence,
 * jamais l'invention d'un nouveau drone.
 *
 * Les choix (animal / milieu / pouvoir) ne sont jamais injectés sous forme de
 * valeurs techniques : chaque option de la config fournit un fragment sémantique
 * (`prompt`) rédigé pour le modèle. Les idées libres sont reformulées par
 * OpenRouter ou citées entre guillemets et recadrées en cas d'indisponibilité.
 *
 * Variantes :
 *  - "instruction" : modèles d'édition pilotés par instruction (FLUX Kontext, Nano Banana…)
 *  - "reference"   : modèles multi-images qui désignent l'entrée par « image 1 » (P-Image-Edit)
 */
export type PromptVariant = "instruction" | "reference";
export type CustomPromptFragments = Partial<Record<"animal" | "movement" | "power", string>>;

const STYLE_LINES = [
  "Inventive futuristic naval engineering: make the child's unusual shapes into purposeful fins, propellers, wings, windows, sensors or lights.",
  "Give this drone its own design language, materials and color palette inspired by the drawing, animal and superpower. White, navy blue and signal red may appear as small accents, not a fixed overall scheme.",
  "High-quality stylized 3D render with expressive materials and lighting, like distinctive concept art for an animated film. Avoid a generic drone template.",
  "Friendly and exciting, suitable for children and families, never scary, no weapons.",
  "Show the whole drone clearly in a scene that reflects its movement and superpower.",
  "Clean readable silhouette.",
  "No text, no letters, no numbers, no logo, no flag, no watermark, no signature.",
];

export function buildDronePrompt(choices: DroneChoices, variant: PromptVariant = "instruction", custom?: CustomPromptFragments): string {
  const { animal, movement, power } = describeChoices(choices);
  const source = variant === "reference" ? "the child's hand-drawn sketch in image 1" : "this child's hand-drawn sketch";

  return [
    `Transform ${source} into a spectacular futuristic naval drone.`,
    "",
    "IMPORTANT:",
    "Preserve the overall silhouette, proportions, major shapes and recognizable creative ideas from the child's original drawing.",
    "Keep the most distinctive drawn parts (body, wings, fins, eyes, antennas, decorations…) recognizable and in the same place; invent fresh engineering details around them.",
    "Ignore the whiteboard background, its frame, reflections and any hands: replace them with a clean scenic background.",
    "",
    "Turn the sketch into a polished futuristic drone while keeping it clearly recognizable as the same creation. Make this particular design visually different from other drones.",
    "",
    `The drone is ${custom?.animal ?? animal.prompt}.`,
    `${custom?.movement ?? movement.prompt}.`,
    `Its magical superpower is ${custom?.power ?? power.prompt}.`,
    "",
    ...STYLE_LINES,
  ].join("\n");
}

/** Petit résumé non technique des choix (logs / benchmark) — le texte libre n'y figure pas. */
export function choicesKey(choices: DroneChoices): string {
  return `${choices.animal}/${choices.movement}/${choices.power}`;
}
