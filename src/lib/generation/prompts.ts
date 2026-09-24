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
 * (`prompt`) rédigé pour le modèle. Un pouvoir inventé par l'enfant est cité
 * entre guillemets et recadré (bienveillant, non violent).
 *
 * Variantes :
 *  - "instruction" : modèles d'édition pilotés par instruction (FLUX Kontext, Nano Banana…)
 *  - "reference"   : modèles multi-images qui désignent l'entrée par « image 1 » (P-Image-Edit)
 */
export type PromptVariant = "instruction" | "reference";

const STYLE_LINES = [
  "Futuristic naval engineering design: sleek hull panels, precise mechanical details, navigation lights, clean white, deep navy blue and signal red color scheme with bright accents.",
  "High-quality stylized 3D render, cinematic lighting, polished and premium, like a concept art for an animated film.",
  "Friendly and exciting, suitable for children and families, never scary, no weapons.",
  "Hero composition, the whole drone fully visible and centered.",
  "Clean readable silhouette.",
  "No text, no letters, no numbers, no logo, no flag, no watermark, no signature.",
];

export function buildDronePrompt(choices: DroneChoices, variant: PromptVariant = "instruction"): string {
  const { animal, movement, power } = describeChoices(choices);
  const source = variant === "reference" ? "the child's hand-drawn sketch in image 1" : "this child's hand-drawn sketch";

  return [
    `Transform ${source} into a spectacular futuristic naval drone.`,
    "",
    "IMPORTANT:",
    "Preserve the overall silhouette, proportions, major shapes and recognizable creative ideas from the child's original drawing.",
    "Every part drawn by the child (body, wings, fins, eyes, antennas, decorations…) must still be there, in the same place.",
    "Ignore the whiteboard background, its frame, reflections and any hands: replace them with a clean scenic background.",
    "",
    "Turn the sketch into a polished, realistic-looking futuristic drone while keeping it clearly recognizable as the same creation.",
    "",
    `The drone is ${animal.prompt}.`,
    `${movement.prompt}.`,
    `Its magical superpower is ${power.prompt}.`,
    "",
    ...STYLE_LINES,
  ].join("\n");
}

/** Petit résumé non technique des choix (logs / benchmark) — le texte libre n'y figure pas. */
export function choicesKey(choices: DroneChoices): string {
  return `${choices.animal}/${choices.movement}/${choices.power}`;
}
