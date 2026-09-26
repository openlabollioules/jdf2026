import { animals, type Animal } from "./animals";
import { movements, type Movement } from "./movements";
import { CUSTOM_POWER_ID, CUSTOM_POWER_MAX, CUSTOM_POWER_MIN, customPowerCard, powers, type Power } from "./powers";
import { BLOCKED_WORDS } from "./moderation";
import type { ChoiceOption } from "./types";

export { animals, movements, powers, customPowerCard, CUSTOM_POWER_ID };
export type { Animal, Movement, Power, ChoiceOption };

export const CUSTOM_CHOICE_ID = "custom";
export const CUSTOM_CHOICE_MIN = CUSTOM_POWER_MIN;
export const CUSTOM_CHOICE_MAX = CUSTOM_POWER_MAX;
export type AnimalChoice = Animal | typeof CUSTOM_CHOICE_ID;
export type MovementChoice = Movement | typeof CUSTOM_CHOICE_ID;
/** Un pouvoir de la liste, ou « custom » (inventé par l'enfant, cf. `customPower`). */
export type PowerChoice = Power | typeof CUSTOM_POWER_ID;

export interface DroneChoices {
  animal: AnimalChoice;
  customAnimal?: string;
  movement: MovementChoice;
  customMovement?: string;
  power: PowerChoice;
  /** Texte libre (uniquement si power === "custom"), déjà nettoyé par `cleanCustomChoice`. */
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

export const customAnimalCard: ChoiceOption<typeof CUSTOM_CHOICE_ID> = {
  ...customPowerCard, label: "Imagine un animal", hint: "écris ton idée", color: "#2FA8D8",
};
export const customMovementCard: ChoiceOption<typeof CUSTOM_CHOICE_ID> = {
  ...customPowerCard, label: "Imagine un milieu", hint: "écris ton idée", color: "#3C8FE0",
};

// --- Idées libres (animal, milieu, pouvoir) ---------------------------------------------

const ALLOWED_CHARS = /^[\p{L}\p{N} '’,.!?-]+$/u;

function normalizeWord(w: string) {
  return w.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export type CustomPowerCheck = { ok: true; value: string } | { ok: false; reason: "length" | "chars" | "blocked" };

/** Nettoie et valide chaque idée libre (utilisé côté client ET côté serveur). */
export function cleanCustomChoice(input: unknown): CustomPowerCheck {
  if (typeof input !== "string") return { ok: false, reason: "length" };
  const value = input.replace(/\s+/g, " ").trim();
  if (value.length < CUSTOM_CHOICE_MIN || value.length > CUSTOM_CHOICE_MAX) return { ok: false, reason: "length" };
  if (!ALLOWED_CHARS.test(value)) return { ok: false, reason: "chars" };
  const blocked = new Set(BLOCKED_WORDS.map(normalizeWord));
  const words = normalizeWord(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.some((w) => blocked.has(w))) return { ok: false, reason: "blocked" };
  return { ok: true, value };
}

export const cleanCustomPower = cleanCustomChoice;

/** Validation stricte des choix (utilisée côté serveur). */
export function parseChoices(input: {
  animal?: unknown;
  customAnimal?: unknown;
  movement?: unknown;
  customMovement?: unknown;
  power?: unknown;
  customPower?: unknown;
}): DroneChoices | null {
  const { animal, movement, power } = input;
  if (animal !== CUSTOM_CHOICE_ID && !animalOptions.has(animal)) return null;
  if (movement !== CUSTOM_CHOICE_ID && !movementOptions.has(movement)) return null;
  if (power !== CUSTOM_POWER_ID && !powerOptions.has(power)) return null;
  const customAnimal = animal === CUSTOM_CHOICE_ID ? cleanCustomChoice(input.customAnimal) : null;
  const customMovement = movement === CUSTOM_CHOICE_ID ? cleanCustomChoice(input.customMovement) : null;
  const customPower = power === CUSTOM_POWER_ID ? cleanCustomChoice(input.customPower) : null;
  if ((customAnimal && !customAnimal.ok) || (customMovement && !customMovement.ok) || (customPower && !customPower.ok)) return null;
  return {
    animal,
    ...(customAnimal?.ok ? { customAnimal: customAnimal.value } : {}),
    movement,
    ...(customMovement?.ok ? { customMovement: customMovement.value } : {}),
    power,
    ...(customPower?.ok ? { customPower: customPower.value } : {}),
  };
}

/** Option synthétique pour un choix libre ; la reformulation LLM est faite côté serveur. */
export function customChoiceOption(kind: "animal" | "movement" | "power", text: string): ChoiceOption {
  const card = kind === "animal" ? customAnimalCard : kind === "movement" ? customMovementCard : customPowerCard;
  const safeText = text.replace(/"/g, "'");
  return {
    ...card,
    label: text,
    summary: `« ${text} »`,
    tagline: `${kind === "animal" ? "Inspiration" : kind === "movement" ? "Milieu" : "Pouvoir"} : ${text}`,
    prompt: `"${safeText}" (the child's idea in French for the ${kind}; interpret visually as a friendly, non-violent, child-safe futuristic naval drone design)`,
  };
}

export const customPowerOption = (text: string) => customChoiceOption("power", text);

export function describeChoices(choices: DroneChoices) {
  const animal = choices.animal === CUSTOM_CHOICE_ID
    ? customChoiceOption("animal", choices.customAnimal ?? "") : animalOptions.get(choices.animal)!;
  const movement = choices.movement === CUSTOM_CHOICE_ID
    ? customChoiceOption("movement", choices.customMovement ?? "") : movementOptions.get(choices.movement)!;
  const power =
    choices.power === CUSTOM_POWER_ID ? customPowerOption(choices.customPower ?? "") : (powerOptions.get(choices.power) as ChoiceOption);
  return {
    animal: animal as ChoiceOption,
    movement: movement as ChoiceOption,
    power,
    isCustomPower: choices.power === CUSTOM_POWER_ID,
    hasCustomChoice: choices.animal === CUSTOM_CHOICE_ID || choices.movement === CUSTOM_CHOICE_ID || choices.power === CUSTOM_POWER_ID,
  };
}
