import type { PromptVariant } from "./prompts";

/**
 * Adaptateurs de modèles Replicate.
 *
 * Chaque modèle d'édition d'image a son propre nom de champ pour l'image de référence
 * et ses propres réglages. Ce registre isole ces différences : le reste de l'application
 * n'appelle que `generateDrone()` et ignore quel modèle tourne derrière.
 *
 * Pour tester un nouveau modèle :
 *   1. ajouter une entrée ici (recommandé), ou
 *   2. définir REPLICATE_MODEL=owner/name et REPLICATE_IMAGE_FIELD / REPLICATE_IMAGE_FIELD_IS_ARRAY
 *      (adaptateur générique).
 */
export interface ModelAdapter {
  /** "owner/name" (sans version). */
  id: string;
  label: string;
  promptVariant: PromptVariant;
  buildInput(args: { prompt: string; imageUri: string; aspectRatio: string; seed?: number }): Record<string, unknown>;
}

export const MODEL_ADAPTERS: ModelAdapter[] = [
  {
    id: "prunaai/p-image-edit",
    label: "P-Image-Edit (très rapide)",
    promptVariant: "reference",
    buildInput: ({ prompt, imageUri, aspectRatio, seed }) => ({
      prompt,
      images: [imageUri],
      aspect_ratio: aspectRatio,
      // turbo=false : un peu plus lent mais meilleure fidélité sur des consignes complexes.
      turbo: false,
      ...(seed !== undefined ? { seed } : {}),
    }),
  },
  {
    id: "black-forest-labs/flux-kontext-pro",
    label: "FLUX.1 Kontext [pro]",
    promptVariant: "instruction",
    buildInput: ({ prompt, imageUri, aspectRatio, seed }) => ({
      prompt,
      input_image: imageUri,
      aspect_ratio: aspectRatio,
      output_format: "jpg",
      safety_tolerance: 2,
      ...(seed !== undefined ? { seed } : {}),
    }),
  },
  {
    id: "prunaai/flux-kontext-dev",
    label: "FLUX.1 Kontext [dev] accéléré",
    promptVariant: "instruction",
    buildInput: ({ prompt, imageUri, aspectRatio, seed }) => ({
      prompt,
      img_cond_path: imageUri,
      aspect_ratio: aspectRatio,
      output_format: "jpg",
      output_quality: 90,
      ...(seed !== undefined ? { seed } : {}),
    }),
  },
  {
    id: "google/nano-banana",
    label: "Nano Banana",
    promptVariant: "instruction",
    buildInput: ({ prompt, imageUri, aspectRatio }) => ({
      prompt,
      image_input: [imageUri],
      aspect_ratio: aspectRatio,
      output_format: "jpg",
    }),
  },
];

/** "owner/name:version" → "owner/name" */
export function modelBaseId(model: string): string {
  return model.split(":")[0]!.trim();
}

export function resolveModelAdapter(
  model: string,
  generic: { imageField: string; imageFieldIsArray: boolean },
): ModelAdapter {
  const base = modelBaseId(model);
  const known = MODEL_ADAPTERS.find((m) => m.id === base);
  if (known) return known;
  return {
    id: base,
    label: base,
    promptVariant: "instruction",
    buildInput: ({ prompt, imageUri, aspectRatio, seed }) => ({
      prompt,
      [generic.imageField]: generic.imageFieldIsArray ? [imageUri] : imageUri,
      aspect_ratio: aspectRatio,
      ...(seed !== undefined ? { seed } : {}),
    }),
  };
}
