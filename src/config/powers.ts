import type { ChoiceOption } from "./types";

/** Pouvoirs proposés : fantastiques, spectaculaires, jamais menaçants. */
export const powers = [
  {
    id: "lightning",
    label: "Lance des éclairs",
    emoji: "⚡",
    image: "/illustrations/lightning.svg",
    color: "#F2B705",
    summary: "lancer des ÉCLAIRS",
    tagline: "Pouvoir éclair",
    prompt: "throwing spectacular glowing lightning arcs with bright blue and white electric sparks (magical, harmless)",
  },
  {
    id: "invisibility",
    label: "Devient invisible",
    emoji: "👻",
    image: "/illustrations/invisibility.svg",
    color: "#8FB6E8",
    summary: "devenir INVISIBLE",
    tagline: "Pouvoir d'invisibilité",
    prompt: "turning partly invisible: parts of its hull fade into a translucent shimmering glass-like glow with sparkles",
  },
  {
    id: "shield",
    label: "Bouclier d'énergie",
    emoji: "🛡️",
    image: "/illustrations/shield.svg",
    color: "#35C2C9",
    summary: "déployer un BOUCLIER D'ÉNERGIE",
    tagline: "Bouclier d'énergie",
    prompt: "surrounded by a glowing protective energy shield bubble with elegant hexagonal light patterns",
  },
  {
    id: "sonar",
    label: "Sonar magique",
    hint: "voit à travers l'océan",
    emoji: "📡",
    image: "/illustrations/sonar.svg",
    color: "#4FD1FF",
    summary: "voir à travers l'océan avec son SONAR MAGIQUE",
    tagline: "Sonar magique",
    prompt: "emitting magical glowing sonar waves (concentric rings of cyan light) that reveal everything around it",
  },
  {
    id: "waves",
    label: "Commande les vagues",
    emoji: "🌊",
    image: "/illustrations/waves.svg",
    color: "#2A7DE1",
    summary: "commander les VAGUES",
    tagline: "Maître des vagues",
    prompt: "magically controlling the ocean: elegant swirling water spirals and luminous waves rise and dance around it",
  },
] as const satisfies readonly ChoiceOption[];

export type Power = (typeof powers)[number]["id"];

/** Carte « champ libre » : l'enfant invente son pouvoir (saisie au clavier tactile). */
export const CUSTOM_POWER_ID = "custom";
export const customPowerCard: ChoiceOption<typeof CUSTOM_POWER_ID> = {
  id: CUSTOM_POWER_ID,
  label: "Invente ton pouvoir",
  hint: "écris ton idée",
  emoji: "✏️",
  image: "/illustrations/custom.svg",
  color: "#EF002F",
  summary: "",
  tagline: "",
  prompt: "",
};

export const CUSTOM_POWER_MIN = 3;
export const CUSTOM_POWER_MAX = 60;
