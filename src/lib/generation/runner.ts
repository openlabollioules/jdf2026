import "server-only";
import type { DroneChoices } from "@/config/choices";
import { getServerConfig } from "@/lib/server/env";
import { randomId } from "@/lib/server/ids";
import { logEvent, metrics } from "@/lib/server/metrics";
import { choicesKey } from "./prompts";
import { generateDrone, GenerationError } from "./generateDrone";
import { generationStore, type GenerationRecord, type StoredImage } from "./store";

export interface StartGenerationArgs {
  choices: DroneChoices;
  sketch: StoredImage;
  requestId?: string;
  captureConfirmedAt?: number;
  clientRetry?: boolean;
  model?: string;
  simulate?: { delayMs: number; fail?: boolean };
}

/**
 * Crée un enregistrement et lance la génération en tâche de fond dans le processus.
 * Le client obtient immédiatement un `generationId` puis interroge l'état.
 */
export function startGeneration(args: StartGenerationArgs): GenerationRecord {
  const cfg = getServerConfig();
  const now = Date.now();
  const rec: GenerationRecord = {
    id: randomId(24),
    requestId: args.requestId,
    choices: args.choices,
    status: "processing",
    retryable: true,
    sketch: args.sketch,
    result: null,
    final: null,
    share: null,
    sharePromise: null,
    attempts: 0,
    timings: {
      capture_confirmed_at: args.captureConfirmedAt,
      generation_requested_at: now,
    },
    abort: new AbortController(),
    createdAt: now,
    expiresAt: now + cfg.retentionMinutes * 60_000,
  };
  generationStore.add(rec);
  metrics.started(!!args.clientRetry);
  logEvent("generation_requested", {
    id: rec.id,
    choices: choicesKey(args.choices),
    clientRetry: !!args.clientRetry,
    sketchKb: Math.round(args.sketch.bytes.length / 1024),
    simulate: args.simulate ? args.simulate.delayMs : undefined,
  });

  void run(rec, args);
  return rec;
}

async function run(rec: GenerationRecord, args: StartGenerationArgs) {
  const sketch = rec.sketch!;
  try {
    const result = await generateDrone({
      ...rec.choices,
      sketchImage: sketch,
      signal: rec.abort.signal,
      model: args.model,
      simulate: args.simulate,
      onEvent: (e) => {
        if (e.type === "provider_started") {
          rec.timings.replicate_started_at ??= e.at;
          logEvent("replicate_started", { id: rec.id, attempt: e.attempt, model: e.model });
        } else if (e.type === "provider_completed") {
          rec.timings.replicate_completed_at = e.at;
        } else if (e.type === "retry") {
          metrics.retry();
          logEvent("replicate_retry", { id: rec.id, attempt: e.attempt, reason: e.reason.slice(0, 200) });
        }
      },
    });
    rec.result = { bytes: result.image, mime: result.mime };
    rec.model = result.model;
    rec.attempts = result.attempts;
    rec.status = "succeeded";
    const apiMs = latency(rec.timings.replicate_started_at, rec.timings.replicate_completed_at);
    metrics.succeeded(apiMs);
    logEvent("replicate_completed", {
      id: rec.id,
      model: result.model,
      attempts: result.attempts,
      apiMs,
      sinceRequestMs: latency(rec.timings.generation_requested_at, Date.now()),
      outputKb: Math.round(result.image.length / 1024),
    });
  } catch (err) {
    rec.status = "failed";
    rec.retryable = err instanceof GenerationError ? err.retryable : true;
    metrics.failed();
    logEvent("generation_failed", {
      id: rec.id,
      code: err instanceof GenerationError ? err.code : "unknown",
      message: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      retryable: rec.retryable,
    });
  } finally {
    // Minimisation : la photo du tableau n'est plus nécessaire côté serveur.
    rec.sketch = null;
  }
}

function latency(from?: number, to?: number): number | undefined {
  return from !== undefined && to !== undefined ? to - from : undefined;
}

export function cancelGeneration(id: string): boolean {
  const rec = generationStore.get(id);
  if (!rec || rec.status !== "processing") return false;
  rec.abort.abort();
  return true;
}
