import type { ChoiceOption } from "./types";

/** Les trois grandes familles de drones navals : aérien, de surface, sous-marin. */
export const movements = [
  {
    id: "fly",
    label: "Voler au-dessus des mers",
    emoji: "✈️",
    image: "/illustrations/fly.svg",
    color: "#5FA8FF",
    summary: "qui VOLE",
    tagline: "Vole au-dessus des mers",
    prompt:
      "It is an aerial naval drone that can fly above the sea: add visible flying features such as wings, rotors or glowing thrusters, shown flying over a bright open ocean with sunlight and waves below",
  },
  {
    id: "sail",
    label: "Naviguer sur les vagues",
    emoji: "🌊",
    image: "/illustrations/sail.svg",
    color: "#3C8FE0",
    summary: "qui NAVIGUE",
    tagline: "Navigue sur les vagues",
    prompt:
      "It is a surface naval drone that can sail on the waves: give it a streamlined hull, stabilizers and water-jet propulsion, shown speeding across the sea surface with a white wake and spray",
  },
  {
    id: "dive",
    label: "Plonger dans les profondeurs",
    emoji: "🌀",
    image: "/illustrations/dive.svg",
    color: "#1D5BC2",
    summary: "qui PLONGE",
    tagline: "Plonge dans les profondeurs",
    prompt:
      "It is an underwater drone that can dive deep: give it fins, a hydrodynamic hull, a propulsor and searchlights, shown gliding in a luminous deep-blue underwater scene with light rays and bubbles",
  },
] as const satisfies readonly ChoiceOption[];

export type Movement = (typeof movements)[number]["id"];
