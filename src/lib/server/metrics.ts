/**
 * Instrumentation minimale (§36) : journaux JSON d'une ligne + statistiques en mémoire.
 * Aucune donnée personnelle : ni image, ni e-mail, ni IP.
 */
export interface GenerationTimings {
  capture_confirmed_at?: number;
  generation_requested_at?: number;
  replicate_started_at?: number;
  replicate_completed_at?: number;
  reveal_started_at?: number;
  email_sent_at?: number;
}

interface Stats {
  started: number;
  succeeded: number;
  failed: number;
  retries: number;
  clientRetries: number;
  emailsSent: number;
  emailsFailed: number;
  apiLatencies: number[];
  totalLatencies: number[];
}

const g = globalThis as unknown as { __droneStats?: Stats };
const stats: Stats = (g.__droneStats ??= {
  started: 0,
  succeeded: 0,
  failed: 0,
  retries: 0,
  clientRetries: 0,
  emailsSent: 0,
  emailsFailed: 0,
  apiLatencies: [],
  totalLatencies: [],
});

export function logEvent(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...fields }));
}

function pushCapped(list: number[], v: number) {
  list.push(v);
  if (list.length > 2000) list.shift();
}

export const metrics = {
  started(clientRetry: boolean) {
    stats.started++;
    if (clientRetry) stats.clientRetries++;
  },
  succeeded(apiMs: number | undefined) {
    stats.succeeded++;
    if (apiMs !== undefined) pushCapped(stats.apiLatencies, apiMs);
  },
  failed() {
    stats.failed++;
  },
  retry() {
    stats.retries++;
  },
  revealed(totalMs: number | undefined) {
    if (totalMs !== undefined && totalMs > 0) pushCapped(stats.totalLatencies, totalMs);
  },
  email(ok: boolean) {
    if (ok) stats.emailsSent++;
    else stats.emailsFailed++;
  },
};

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx]!;
}

export function getStats() {
  const done = stats.succeeded + stats.failed;
  return {
    generations: { started: stats.started, succeeded: stats.succeeded, failed: stats.failed },
    failureRate: done ? stats.failed / done : null,
    serverRetries: stats.retries,
    clientRetries: stats.clientRetries,
    apiLatencyMs: { median: percentile(stats.apiLatencies, 50), p95: percentile(stats.apiLatencies, 95), n: stats.apiLatencies.length },
    totalLatencyMs: { median: percentile(stats.totalLatencies, 50), p95: percentile(stats.totalLatencies, 95), n: stats.totalLatencies.length },
    emails: { sent: stats.emailsSent, failed: stats.emailsFailed },
  };
}
