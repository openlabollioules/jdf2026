import { parseChoices } from "@/config/choices";
import { generationStore } from "@/lib/generation/store";
import { startGeneration } from "@/lib/generation/runner";
import { getServerConfig } from "@/lib/server/env";
import { json, readJsonBody } from "@/lib/server/http";
import { decodeImageDataUrl, ImageValidationError } from "@/lib/server/image";
import { clientKey, RateLimiter } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __droneGenLimiter?: RateLimiter };
const MAX_CONCURRENT = 20;
const REQUEST_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

interface GenerateBody {
  image?: unknown;
  animal?: unknown;
  movement?: unknown;
  power?: unknown;
  customPower?: unknown;
  requestId?: unknown;
  captureConfirmedAt?: unknown;
  retry?: unknown;
  dev?: { model?: unknown; simulate?: { delayMs?: unknown; fail?: unknown } };
}

export async function POST(req: Request) {
  const cfg = getServerConfig();
  const limiter = (g.__droneGenLimiter ??= new RateLimiter(cfg.limits.generatePerMinute, 60_000));

  const body = await readJsonBody<GenerateBody>(req, Math.ceil(cfg.limits.maxUploadBytes * 1.4) + 8192);
  if (!body) return json({ error: "invalid_body" }, 400);

  // Idempotence : un double envoi de la même soumission renvoie la même génération.
  const requestId = typeof body.requestId === "string" && REQUEST_ID_RE.test(body.requestId) ? body.requestId : undefined;
  if (requestId) {
    const existing = generationStore.findByRequestId(requestId);
    if (existing) return json({ generationId: existing.id });
  }

  if (!limiter.check(clientKey(req))) return json({ error: "rate_limited" }, 429);

  const choices = parseChoices(body);
  if (!choices) return json({ error: "invalid_choices" }, 400);

  let sketch;
  try {
    sketch = decodeImageDataUrl(body.image, cfg.limits.maxUploadBytes);
  } catch (err) {
    return json({ error: "invalid_image", detail: err instanceof ImageValidationError ? err.message : undefined }, 400);
  }

  if (generationStore.processingCount() >= MAX_CONCURRENT) return json({ error: "busy" }, 503);

  // Surcharges réservées au mode développeur.
  let model: string | undefined;
  let simulate: { delayMs: number; fail?: boolean } | undefined;
  if (cfg.devTools && body.dev) {
    if (typeof body.dev.model === "string" && /^[\w.-]+\/[\w.-]+(:[a-f0-9]{16,})?$/.test(body.dev.model)) model = body.dev.model;
    const s = body.dev.simulate;
    if (s && typeof s.delayMs === "number" && s.delayMs >= 0 && s.delayMs <= 120_000) {
      simulate = { delayMs: s.delayMs, fail: s.fail === true };
    }
  }

  const captureConfirmedAt =
    typeof body.captureConfirmedAt === "number" && Math.abs(Date.now() - body.captureConfirmedAt) < 3600_000
      ? body.captureConfirmedAt
      : undefined;

  const rec = startGeneration({
    choices,
    sketch,
    requestId,
    captureConfirmedAt,
    clientRetry: body.retry === true,
    model,
    simulate,
  });
  return json({ generationId: rec.id }, 202);
}
