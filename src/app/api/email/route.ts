import { describeChoices } from "@/config/choices";
import { buildDroneEmail, getEmailProvider, isValidEmail } from "@/lib/email";
import { generationStore } from "@/lib/generation/store";
import { getServerConfig } from "@/lib/server/env";
import { json, readJsonBody } from "@/lib/server/http";
import { ID_RE } from "@/lib/server/ids";
import { logEvent, metrics } from "@/lib/server/metrics";
import { clientKey, RateLimiter } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __droneEmailLimiter?: RateLimiter };

export async function POST(req: Request) {
  const cfg = getServerConfig();
  const limiter = (g.__droneEmailLimiter ??= new RateLimiter(cfg.limits.emailPerMinute, 60_000));

  const provider = getEmailProvider();
  if (!provider) return json({ error: "disabled" }, 404);

  const body = await readJsonBody<{ generationId?: unknown; email?: unknown }>(req, 2048);
  if (!body) return json({ error: "invalid_body" }, 400);
  if (!isValidEmail(body.email)) return json({ error: "invalid_email" }, 400);
  const id = typeof body.generationId === "string" && ID_RE.test(body.generationId) ? body.generationId : "";
  const rec = id ? generationStore.get(id) : undefined;
  const img = rec?.final ?? rec?.result;
  if (!rec || !img) return json({ error: "not_found" }, 404);

  if (!limiter.check(clientKey(req))) return json({ error: "rate_limited" }, 429);

  const d = describeChoices(rec.choices);
  const tagline = [d.animal.tagline, d.movement.tagline, d.power.tagline].join(" • ");
  const { subject, html, text } = buildDroneEmail({ tagline, eventName: cfg.ui.eventName });
  const ext = img.mime === "image/png" ? "png" : img.mime === "image/svg+xml" ? "svg" : "jpg";

  try {
    await provider.send({
      to: body.email.trim(),
      from: cfg.email.from,
      subject,
      html,
      text,
      attachment: { filename: `mon-super-drone.${ext}`, bytes: img.bytes, mime: img.mime },
    });
    rec.timings.email_sent_at = Date.now();
    metrics.email(true);
    logEvent("email_sent", { id: rec.id, provider: provider.name });
    return json({ ok: true });
  } catch (err) {
    metrics.email(false);
    // Jamais l'adresse dans les journaux.
    logEvent("email_failed", { id: rec.id, provider: provider.name, message: String(err).slice(0, 200) });
    return json({ error: "send_failed" }, 502);
  }
}
