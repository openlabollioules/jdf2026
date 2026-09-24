/**
 * Filtre volontairement simple pour le pouvoir inventé (champ libre) :
 * refuse les mots grossiers, violents ou haineux les plus courants.
 * Liste à compléter selon l'événement. Les mots sont comparés sans accents ni majuscules,
 * mot par mot (pas de faux positif sur « contrôle » pour « con », par exemple).
 */
export const BLOCKED_WORDS = [
  // grossièretés
  "merde", "putain", "pute", "con", "conne", "connard", "connasse", "salope", "salaud", "encule", "enculer",
  "bite", "couille", "couilles", "nichon", "nichons", "cul", "zizi", "caca", "pipi", "prout", "chier", "foutre", "bordel", "nique",
  "fuck", "shit", "bitch", "dick", "pussy", "sex", "sexe", "porno",
  // violence / horreur
  "tuer", "tue", "tuent", "mort", "morts", "meurtre", "sang", "sanglant", "massacre", "cadavre", "decapiter", "suicide",
  "kill", "blood", "dead",
  // haine
  "nazi", "hitler", "raciste",
];
