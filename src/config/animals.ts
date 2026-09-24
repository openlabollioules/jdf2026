import type { ChoiceOption } from "./types";

/**
 * Animaux marins d'inspiration. Pour en ajouter un : ajouter une entrée ici
 * (+ éventuellement une illustration dans public/illustrations/). Rien d'autre à toucher.
 */
export const animals = [
  {
    id: "shark",
    label: "Requin",
    hint: "rapide, puissant",
    emoji: "🦈",
    image: "/illustrations/shark.svg",
    color: "#3B6FD8",
    summary: "du REQUIN",
    tagline: "Rapide comme un requin",
    prompt: "inspired by the speed, power and streamlined hydrodynamic shapes of a shark (sharp dorsal fin, sleek tapered body)",
  },
  {
    id: "dolphin",
    label: "Dauphin",
    hint: "agile, joueur",
    emoji: "🐬",
    image: "/illustrations/dolphin.svg",
    color: "#2FA8D8",
    summary: "du DAUPHIN",
    tagline: "Agile comme un dauphin",
    prompt: "inspired by the agility, playful curves and smooth rounded shapes of a dolphin",
  },
  {
    id: "whale",
    label: "Baleine",
    hint: "immense, calme",
    emoji: "🐋",
    image: "/illustrations/whale.svg",
    color: "#1F4FB5",
    summary: "de la BALEINE",
    tagline: "Imposant comme une baleine",
    prompt: "inspired by the huge volumes, calm strength and majestic presence of a whale (broad rounded body, large tail flukes)",
  },
  {
    id: "turtle",
    label: "Tortue marine",
    hint: "solide, protégée",
    emoji: "🐢",
    image: "/illustrations/turtle.svg",
    color: "#1E9C8A",
    summary: "de la TORTUE MARINE",
    tagline: "Solide comme une tortue marine",
    prompt: "inspired by the sturdy protective shell and calm character of a sea turtle (dome armor with hexagonal plates, flipper-like fins)",
  },
] as const satisfies readonly ChoiceOption[];

export type Animal = (typeof animals)[number]["id"];
