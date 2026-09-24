import { animals, type Animal } from "./animals";
import { movements, type Movement } from "./movements";
import { CUSTOM_POWER_ID, CUSTOM_POWER_MAX, CUSTOM_POWER_MIN, customPowerCard, powers, type Power } from "./powers";
import { BLOCKED_WORDS } from "./moderation";
import type { ChoiceOption } from "./types";

export { animals, movements, powers, customPowerCard, CUSTOM_POWER_ID };
export type { Animal, Movement, Power, ChoiceOption };

/** Un pouvoir de la liste, ou « custom » (inventé par l'enfant, cf. `customPower`). */
export type PowerChoice = Power | typeof CUSTOM_POWER_ID;

export interface DroneChoices {
  animal: Animal;
  movement: Movement;
  power: PowerChoice;
  /** Texte libre (uniquement si power === "custom"), déjà nettoyé par `cleanCustomPower`. */
  customPower?: string;
}

function finder<T extends ChoiceOption>(list: readonly T[]) {
  const byId = new Map(list.map((o) => [o.id, o]));
  return {
    get: (id: string): T | undefined => byId.get(id),
    has: (id: unknown): id is T["id"] => typeof id === "string" && byId.has(id),
  };
}

export const animalOptions = finder(animals);
export const movementOptions = finder(movements);
export const powerOptions = finder(powers);

// --- Pouvoir inventé (champ libre) -----------------------------------------------------

const ALLOWED_CHARS = /^[\p{L}\p{N} '’,.!?-]+$/u;

function normalizeWord(w: string) {
  return w.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export type CustomPowerCheck = { ok: true; value: string } | { ok: false; reason: "length" | "chars" | "blocked" };

/** Nettoie et valide le pouvoir inventé (utilisé côté client ET côté serveur). */
export function cleanCustomPower(input: unknown): CustomPowerCheck {
  if (typeof input !== "string") return { ok: false, reason: "length" };
  const value = input.replace(/\s+/g, " ").trim();
  if (value.length < CUSTOM_POWER_MIN || value.length > CUSTOM_POWER_MAX) return { ok: false, reason: "length" };
  if (!ALLOWED_CHARS.test(value)) return { ok: false, reason: "chars" };
  const blocked = new Set(BLOCKED_WORDS.map(normalizeWord));
  const words = normalizeWord(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.some((w) => blocked.has(w))) return { ok: false, reason: "blocked" };
  return { ok: true, value };
}

/** Validation stricte des choix (utilisée côté serveur). */
export function parseChoices(input: {
  animal?: unknown;
  movement?: unknown;
  power?: unknown;
  customPower?: unknown;
}): DroneChoices | null {
  const { animal, movement, power } = input;
  if (!animalOptions.has(animal) || !movementOptions.has(movement)) return null;
  if (power === CUSTOM_POWER_ID) {
    const check = cleanCustomPower(input.customPower);
    return check.ok ? { animal, movement, power: CUSTOM_POWER_ID, customPower: check.value } : null;
  }
  if (!powerOptions.has(power)) return null;
  return { animal, movement, power };
}

/** Option synthétique décrivant un pouvoir inventé (mêmes champs qu'une option de la config). */
export function customPowerOption(text: string): ChoiceOption {
  return {
    ...customPowerCard,
    label: text,
    summary: `« ${text} »`,
    tagline: `Pouvoir : ${text}`,
    // Le texte vient de l'enfant (en français) : il est cité et recadré pour rester bienveillant.
    prompt: `"${text.replace(/"/g, "'")}" (a magical ability imagined by the child, written in French — interpret it as a spectacular, friendly, non-violent and child-safe magical effect)`,
  };
}

export function describeChoices(choices: DroneChoices) {
  const power =
    choices.power === CUSTOM_POWER_ID ? customPowerOption(choices.customPower ?? "") : (powerOptions.get(choices.power) as ChoiceOption);
  return {
    animal: animalOptions.get(choices.animal)! as ChoiceOption,
    movement: movementOptions.get(choices.movement)! as ChoiceOption,
    power,
    isCustomPower: choices.power === CUSTOM_POWER_ID,
  };
}
