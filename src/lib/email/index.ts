import "server-only";
import { texts } from "@/config/texts";
import { getServerConfig, isEmailConfigured } from "@/lib/server/env";
import { createLogProvider, createResendProvider, createSendgridProvider, createSmtpProvider } from "./providers";
import type { EmailProvider } from "./types";

export function getEmailProvider(): EmailProvider | null {
  const { email } = getServerConfig();
  if (!isEmailConfigured(email)) return null;
  switch (email.provider) {
    case "resend":
      return createResendProvider(email.resendApiKey);
    case "sendgrid":
      return createSendgridProvider(email.sendgridApiKey);
    case "smtp":
      return createSmtpProvider(email.smtpUrl);
    case "log":
      return createLogProvider();
    default:
      return null;
  }
}

/** Validation volontairement simple et stricte (pas d'espaces, un @, un domaine avec un point). */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (v.length < 6 || v.length > 254) return false;
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(v) && !v.includes("..");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function buildDroneEmail(opts: { tagline: string; shareUrl?: string; eventName?: string }) {
  const title = texts.result.title;
  const text = [
    title.toUpperCase(),
    "",
    ...(opts.eventName ? [opts.eventName, ""] : []),
    "Voici le drone du futur que tu as imaginé et dessiné !",
    opts.tagline,
    "",
    "L'image est en pièce jointe.",
    "",
    "Cette adresse e-mail a été utilisée uniquement pour cet envoi et n'a pas été conservée.",
  ].join("\n");
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#0b1b3f">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<div style="background:#061a4a;border-radius:14px 14px 0 0;padding:28px 24px;text-align:center;border-bottom:6px solid #ef002f">
<h1 style="font-size:28px;letter-spacing:1px;text-transform:uppercase;margin:0;color:#ffffff">${escapeHtml(title)}</h1>${opts.eventName ? `<p style="margin:10px 0 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#c9d6ec">${escapeHtml(opts.eventName)}</p>` : ""}
</div>
<div style="background:#ffffff;border-radius:0 0 14px 14px;padding:24px;text-align:center">
<p style="font-size:17px;margin:0 0 12px">Voici le drone du futur que tu as imaginé et dessiné&nbsp;!</p>
<p style="font-size:15px;margin:0 0 20px;color:#002a8f;font-weight:bold">${escapeHtml(opts.tagline)}</p>
<p style="font-size:15px;margin:0">L'image est en pièce jointe.</p>
</div>
<p style="font-size:12px;color:#5b6b8c;margin-top:24px;text-align:center">Cette adresse e-mail a été utilisée uniquement pour cet envoi et n'a pas été conservée.</p>
</div></body></html>`;
  return { subject: texts.email.subject, text, html };
}
