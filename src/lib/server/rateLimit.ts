/**
 * Limiteur de débit en mémoire (fenêtre glissante) — suffisant pour une borne
 * ou une instance unique. Protège contre les boucles et abus accidentels.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Renvoie true si la requête est autorisée (et l'enregistre). */
  check(key: string, now = Date.now()): boolean {
    const from = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > from);
    if (list.length >= this.limit) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.set(key, list);
    if (this.hits.size > 5000) this.prune(now);
    return true;
  }

  private prune(now: number) {
    const from = now - this.windowMs;
    for (const [k, v] of this.hits) {
      if (!v.some((t) => t > from)) this.hits.delete(k);
    }
  }
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}
