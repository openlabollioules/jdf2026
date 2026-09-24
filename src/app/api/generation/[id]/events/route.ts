import { generationStore } from "@/lib/generation/store";
import { json, readJsonBody } from "@/lib/server/http";
import { ID_RE } from "@/lib/server/ids";
import { logEvent, metrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/** Instrumentation côté client (début de la révélation). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = ID_RE.test(id) ? generationStore.get(id) : undefined;
  const body = await readJsonBody<{ event?: unknown }>(req, 1024);
  if (!rec || !body) return json({ ok: false }, 404);

  if (body.event === "reveal_started" && !rec.timings.reveal_started_at) {
    const now = Date.now();
    rec.timings.reveal_started_at = now;
    const t = rec.timings;
    const totalMs = t.capture_confirmed_at ? now - t.capture_confirmed_at : undefined;
    metrics.revealed(totalMs);
    logEvent("reveal_started", {
      id: rec.id,
      totalMs,
      apiMs: t.replicate_started_at && t.replicate_completed_at ? t.replicate_completed_at - t.replicate_started_at : undefined,
      waitAfterResultMs: t.replicate_completed_at ? now - t.replicate_completed_at : undefined,
    });
  }
  return json({ ok: true });
}
