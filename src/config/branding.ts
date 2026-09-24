/**
 * Identité visuelle de l'événement. Logo : public/logo.png ; emblème (version détourée de public/images.png) : public/brand/emblem.png.
 * Le nom de l'événement peut être surchargé par la variable EVENT_NAME.
 */
export const branding = {
  logo: { src: "/logo.png", alt: "Naval Group", width: 500, height: 141 },
  /** Emblème affiché sur le sous-marin et le centre d'essais (PNG transparent). */
  emblem: { src: "/brand/emblem.png", width: 294, height: 240 },
  eventName: "Journée des Familles 2026",
  colors: {
    navy: "#002A8F",
    navyDeep: "#061A4A",
    abyss: "#030E2B",
    red: "#EF002F",
    steel: "#E8EEF8",
    cyan: "#5FD4FF",
  },
} as const;
