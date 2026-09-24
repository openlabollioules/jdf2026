"use client";

import type { DroneChoices } from "@/config/choices";

/** Client HTTP du navigateur vers notre backend (jamais vers Replicate directement). */

export interface DevOverrides {
  model?: string;
  simulate?: { delayMs: number; fail?: boolean };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(data.error || `HTTP ${res.status}`, res.status, res.status >= 500 || res.status === 429);
  return data;
}

export function createGeneration(
  args: {
    image: string;
    requestId: string;
    captureConfirmedAt?: number;
    retry: boolean;
    dev?: DevOverrides;
  } & DroneChoices,
  signal?: AbortSignal,
) {
  return post<{ generationId: string }>("/api/generate", args, signal);
}

export type GenerationPoll =
  | { status: "processing" }
  | { status: "succeeded"; imageUrl: string }
  | { status: "failed"; retryable: boolean };

export async function getGeneration(id: string, signal?: AbortSignal): Promise<GenerationPoll> {
  const res = await fetch(`/api/generation/${encodeURIComponent(id)}`, { signal, cache: "no-store" });
  if (res.status === 404) return { status: "failed", retryable: true };
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status, true);
  return (await res.json()) as GenerationPoll;
}

export function cancelGeneration(id: string) {
  void fetch(`/api/generation/${encodeURIComponent(id)}`, { method: "DELETE", keepalive: true }).catch(() => undefined);
}

export function shareGeneration(id: string, composedImage: string | null, signal?: AbortSignal) {
  return post<{ shareUrl: string | null; expiresAt?: number | null; reason?: "unavailable" | "failed" }>(
    `/api/generation/${encodeURIComponent(id)}/share`,
    composedImage ? { image: composedImage } : {},
    signal,
  );
}

export function reportEvent(id: string, event: "reveal_started") {
  void fetch(`/api/generation/${encodeURIComponent(id)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => undefined);
}

export function sendEmail(generationId: string, email: string) {
  return post<{ ok: true }>("/api/email", { generationId, email });
}

/** Précharge et décode l'image avant la révélation (évite une apparition vide, §39). */
export async function preloadImage(url: string, signal?: AbortSignal): Promise<void> {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("aborted", "AbortError"));
    signal?.addEventListener("abort", onAbort, { once: true });
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image load failed"));
  });
  try {
    await img.decode();
  } catch {
    /* déjà chargée : suffisant */
  }
}
