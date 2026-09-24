import { getServerConfig } from "@/lib/server/env";
import { json } from "@/lib/server/http";
import { getStats } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/** Statistiques de fonctionnement (mode développeur uniquement). */
export async function GET() {
  const cfg = getServerConfig();
  if (!cfg.devTools) return json({ error: "not_found" }, 404);
  return json({
    ...getStats(),
    config: {
      provider: cfg.generation.provider,
      model: cfg.generation.provider === "replicate" ? cfg.replicate.model : "mock",
      storage: cfg.storage.provider,
      email: cfg.email.provider,
    },
  });
}
