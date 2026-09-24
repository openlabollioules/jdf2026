/**
 * Client HTTP minimal pour l'API Replicate (sans SDK).
 * Utilisé exclusivement côté serveur : le token ne quitte jamais le serveur.
 */

const API = "https://api.replicate.com/v1";

export type PredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled";

export interface Prediction {
  id: string;
  status: PredictionStatus;
  output?: unknown;
  error?: unknown;
  metrics?: { predict_time?: number };
}

export class ReplicateError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ReplicateError";
  }
}

function headers(token: string, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function asError(res: Response): Promise<ReplicateError> {
  let detail = "";
  try {
    const body = (await res.json()) as { detail?: string; title?: string };
    detail = body.detail || body.title || "";
  } catch {
    /* corps non JSON */
  }
  const retryable = res.status === 429 || res.status >= 500;
  return new ReplicateError(`Replicate HTTP ${res.status}${detail ? `: ${detail}` : ""}`, res.status, retryable);
}

/**
 * Crée une prédiction. `model` peut être "owner/name" (modèle officiel, dernière version)
 * ou "owner/name:version" (version figée).
 * `waitSeconds` active le mode synchrone de Replicate (réponse directe si le modèle
 * termine dans ce délai) : on gagne un aller-retour de polling sur les modèles rapides.
 */
export async function createPrediction(opts: {
  token: string;
  model: string;
  input: Record<string, unknown>;
  waitSeconds?: number;
  signal?: AbortSignal;
}): Promise<Prediction> {
  const [base, version] = opts.model.split(":");
  const url = version ? `${API}/predictions` : `${API}/models/${base}/predictions`;
  const body = version ? { version, input: opts.input } : { input: opts.input };
  const extra: Record<string, string> = {};
  if (opts.waitSeconds && opts.waitSeconds > 0) extra.Prefer = `wait=${Math.min(60, Math.round(opts.waitSeconds))}`;

  const res = await fetch(url, {
    method: "POST",
    headers: headers(opts.token, extra),
    body: JSON.stringify(body),
    signal: opts.signal,
    cache: "no-store",
  });
  if (!res.ok) throw await asError(res);
  return (await res.json()) as Prediction;
}

export async function getPrediction(token: string, id: string, signal?: AbortSignal): Promise<Prediction> {
  const res = await fetch(`${API}/predictions/${encodeURIComponent(id)}`, {
    headers: headers(token),
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw await asError(res);
  return (await res.json()) as Prediction;
}

export async function cancelPrediction(token: string, id: string): Promise<void> {
  try {
    await fetch(`${API}/predictions/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: headers(token),
      cache: "no-store",
    });
  } catch {
    /* best effort */
  }
}

/** Les modèles renvoient soit une URL, soit un tableau d'URLs. */
export function extractOutputUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const first = output.find((o) => typeof o === "string");
    return typeof first === "string" ? first : null;
  }
  if (output && typeof output === "object" && "url" in output && typeof (output as { url: unknown }).url === "string") {
    return (output as { url: string }).url;
  }
  return null;
}

export function isTerminal(status: PredictionStatus): boolean {
  return status === "succeeded" || status === "failed" || status === "canceled";
}
