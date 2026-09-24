import "server-only";
import type { DroneChoices } from "@/config/choices";
import type { GenerationTimings } from "@/lib/server/metrics";

/**
 * Registre des générations en mémoire du processus Node.
 *
 * Choix assumé : la cible est une borne / une instance unique (`next start`).
 * Pour un déploiement multi-instances (serverless), remplacer ce module par un
 * stockage partagé (Redis, KV…) exposant la même interface.
 *
 * Minimisation des données : le croquis est effacé dès la fin de la génération ;
 * les enregistrements expirent après SESSION_RETENTION_MINUTES.
 */
export interface StoredImage {
  bytes: Buffer;
  mime: string;
}

export interface GenerationRecord {
  id: string;
  requestId?: string;
  choices: DroneChoices;
  status: "processing" | "succeeded" | "failed";
  retryable: boolean;
  sketch: StoredImage | null;
  result: StoredImage | null;
  /** Composition finale (cadre + titre) envoyée par le navigateur. */
  final: StoredImage | null;
  share: { url: string; expiresAt: number } | null;
  shareUnavailable?: boolean;
  sharePromise: Promise<{ url: string; expiresAt: number } | null> | null;
  model?: string;
  attempts: number;
  timings: GenerationTimings;
  abort: AbortController;
  createdAt: number;
  expiresAt: number;
}

interface StoreState {
  records: Map<string, GenerationRecord>;
  byRequestId: Map<string, string>;
  sweeper?: ReturnType<typeof setInterval>;
}

const g = globalThis as unknown as { __droneStore?: StoreState };
const state: StoreState = (g.__droneStore ??= { records: new Map(), byRequestId: new Map() });

function sweep(now = Date.now()) {
  for (const [id, rec] of state.records) {
    if (rec.expiresAt <= now) {
      rec.abort.abort();
      state.records.delete(id);
      if (rec.requestId) state.byRequestId.delete(rec.requestId);
    }
  }
}

if (!state.sweeper) {
  state.sweeper = setInterval(sweep, 60_000);
  state.sweeper.unref?.();
}

export const generationStore = {
  get(id: string): GenerationRecord | undefined {
    const rec = state.records.get(id);
    if (rec && rec.expiresAt <= Date.now()) {
      sweep();
      return undefined;
    }
    return rec;
  },
  findByRequestId(requestId: string): GenerationRecord | undefined {
    const id = state.byRequestId.get(requestId);
    return id ? this.get(id) : undefined;
  },
  add(rec: GenerationRecord) {
    state.records.set(rec.id, rec);
    if (rec.requestId) state.byRequestId.set(rec.requestId, rec.id);
  },
  processingCount(): number {
    let n = 0;
    for (const r of state.records.values()) if (r.status === "processing") n++;
    return n;
  },
  sweep,
};
