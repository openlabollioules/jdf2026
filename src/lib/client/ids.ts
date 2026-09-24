/** Identifiant de session aléatoire (fonctionne aussi hors contexte sécurisé). */
export function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const rnd = typeof crypto !== "undefined" && crypto.getRandomValues ? Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("") : Math.random().toString(16).slice(2, 14);
  return `${Date.now().toString(36)}-${rnd}`;
}
