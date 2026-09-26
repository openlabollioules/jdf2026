import "server-only";
import type { DroneChoices } from "@/config/choices";
import { getServerConfig } from "@/lib/server/env";
import { buildDronePrompt } from "./prompts";
import { rephraseCustomChoices } from "./rephrase";
import { modelBaseId, resolveModelAdapter } from "./models";
import { cancelPrediction, createPrediction, extractOutputUrl, getPrediction, isTerminal, ReplicateError, type Prediction } from "./replicate";
import { generateMockDrone } from "./mock";

/**
 * Point d'entrée unique de la génération (cf. §11).
 * Le reste de l'application ne dépend ni du fournisseur ni du modèle utilisé.
 */
export interface GenerateDroneInput extends DroneChoices {
  sketchImage: { bytes: Buffer; mime: string };
  /** Annule la génération (reset de la borne, timeout…). */
  signal?: AbortSignal;
  /** Surcharge du modèle (outils de dev / benchmark uniquement). */
  model?: string;
  seed?: number;
  /** Simulation (outils de dev uniquement). */
  simulate?: { delayMs: number; fail?: boolean };
  /** Appelé à chaque étape pour l'instrumentation. */
  onEvent?: (event: GenerationEvent) => void;
}

export type GenerationEvent =
  | { type: "provider_started"; attempt: number; model: string; at: number }
  | { type: "provider_completed"; attempt: number; at: number; predictTimeS?: number }
  | { type: "retry"; attempt: number; reason: string };

export interface GenerateDroneResult {
  image: Buffer;
  mime: string;
  model: string;
  attempts: number;
}

export class GenerationError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly code: "timeout" | "aborted" | "provider" | "invalid_output" | "config" = "provider",
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new GenerationError("aborted", false, "aborted"));
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new GenerationError("aborted", false, "aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function generateDrone(input: GenerateDroneInput): Promise<GenerateDroneResult> {
  const cfg = getServerConfig();
  const timeout = AbortSignal.timeout(cfg.generation.timeoutMs);
  const signal = input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;

  try {
    if (input.simulate || cfg.generation.provider === "mock") {
      const delayMs = input.simulate?.delayMs ?? cfg.generation.mockDelayMs;
      input.onEvent?.({ type: "provider_started", attempt: 1, model: "mock", at: Date.now() });
      await sleep(delayMs, signal);
      if (input.simulate?.fail) throw new GenerationError("simulated failure", true);
      const image = generateMockDrone(input);
      input.onEvent?.({ type: "provider_completed", attempt: 1, at: Date.now() });
      return { image, mime: "image/svg+xml", model: "mock", attempts: 1 };
    }
    return await generateWithReplicate(input, signal);
  } catch (err) {
    if (err instanceof GenerationError) {
      if (err.code === "aborted" && timeout.aborted) throw new GenerationError("timeout", true, "timeout");
      throw err;
    }
    if (timeout.aborted) throw new GenerationError("timeout", true, "timeout");
    if (signal.aborted) throw new GenerationError("aborted", false, "aborted");
    throw new GenerationError(err instanceof Error ? err.message : String(err), true);
  }
}

async function generateWithReplicate(input: GenerateDroneInput, signal: AbortSignal): Promise<GenerateDroneResult> {
  const cfg = getServerConfig();
  const { token } = cfg.replicate;
  if (!token) throw new GenerationError("REPLICATE_API_TOKEN manquant", false, "config");

  const model = input.model || cfg.replicate.model;
  const adapter = resolveModelAdapter(model, cfg.replicate);
  const customPrompts = await rephraseCustomChoices(input, cfg.openrouter, signal);
  const prompt = buildDronePrompt(input, adapter.promptVariant, customPrompts);
  // Data URI : recommandé par Replicate pour les fichiers < 1 Mo, ce qui est le cas
  // de nos captures redimensionnées (~150–400 Ko). Aucun stockage intermédiaire.
  const imageUri = `data:${input.sketchImage.mime};base64,${input.sketchImage.bytes.toString("base64")}`;

  let extra: Record<string, unknown> = {};
  if (cfg.replicate.extraInput) {
    try {
      extra = JSON.parse(cfg.replicate.extraInput) as Record<string, unknown>;
    } catch {
      console.warn("[generation] REPLICATE_EXTRA_INPUT n'est pas un JSON valide, ignoré");
    }
  }
  const modelInput = {
    ...adapter.buildInput({ prompt, imageUri, aspectRatio: cfg.replicate.aspectRatio, seed: input.seed }),
    ...extra,
  };

  const maxAttempts = cfg.generation.maxRetries + 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let predictionId: string | undefined;
    try {
      input.onEvent?.({ type: "provider_started", attempt, model: modelBaseId(model), at: Date.now() });
      let prediction: Prediction = await createPrediction({ token, model, input: modelInput, waitSeconds: 8, signal });
      predictionId = prediction.id;

      while (!isTerminal(prediction.status)) {
        await sleep(cfg.generation.pollIntervalMs, signal);
        prediction = await getPrediction(token, prediction.id, signal);
      }
      input.onEvent?.({ type: "provider_completed", attempt, at: Date.now(), predictTimeS: prediction.metrics?.predict_time });

      if (prediction.status !== "succeeded") {
        // Un échec du modèle (ex. faux positif du filtre) peut réussir au second essai.
        throw new ReplicateError(`prediction ${prediction.status}: ${String(prediction.error ?? "")}`.slice(0, 300), 0, true);
      }
      const url = extractOutputUrl(prediction.output);
      if (!url) throw new GenerationError("sortie du modèle invalide", true, "invalid_output");

      const { bytes, mime } = await downloadImage(url, signal);
      return { image: bytes, mime, model: modelBaseId(model), attempts: attempt };
    } catch (err) {
      lastError = err;
      if (signal.aborted) {
        if (predictionId) void cancelPrediction(token, predictionId);
        throw new GenerationError("aborted", false, "aborted");
      }
      const retryable = err instanceof ReplicateError ? err.retryable : !(err instanceof GenerationError) || err.retryable;
      if (!retryable || attempt >= maxAttempts) break;
      const reason = err instanceof Error ? err.message : String(err);
      input.onEvent?.({ type: "retry", attempt, reason });
      const is429 = err instanceof ReplicateError && err.status === 429;
      await sleep(is429 ? 1500 * attempt : 400, signal);
    }
  }

  if (lastError instanceof GenerationError) throw lastError;
  const retryable = lastError instanceof ReplicateError ? lastError.retryable || lastError.status === 0 : true;
  throw new GenerationError(lastError instanceof Error ? lastError.message : "échec de génération", retryable);
}

async function downloadImage(url: string, signal: AbortSignal): Promise<{ bytes: Buffer; mime: string }> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new ReplicateError(`téléchargement du résultat HTTP ${res.status}`, res.status, true);
  const mime = (res.headers.get("content-type") || "").split(";")[0]!.trim() || guessMime(url);
  if (!mime.startsWith("image/")) throw new GenerationError(`type de sortie inattendu: ${mime}`, true, "invalid_output");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_OUTPUT_BYTES) throw new GenerationError("taille de sortie invalide", true, "invalid_output");
  return { bytes: buf, mime };
}

function guessMime(url: string): string {
  const ext = url.split("?")[0]!.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}
