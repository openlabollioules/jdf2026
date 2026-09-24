import "server-only";
import type { EmailMessage, EmailProvider } from "./types";

export function createResendProvider(apiKey: string): EmailProvider {
  if (!apiKey) throw new Error("RESEND_API_KEY manquant");
  return {
    name: "resend",
    async send(m: EmailMessage) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: m.from,
          to: [m.to],
          subject: m.subject,
          html: m.html,
          text: m.text,
          attachments: [{ filename: m.attachment.filename, content: m.attachment.bytes.toString("base64") }],
        }),
      });
      if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
    },
  };
}

export function createSendgridProvider(apiKey: string): EmailProvider {
  if (!apiKey) throw new Error("SENDGRID_API_KEY manquant");
  return {
    name: "sendgrid",
    async send(m: EmailMessage) {
      const from = /^(.*)<(.+)>$/.exec(m.from);
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: m.to }] }],
          from: from ? { email: from[2]!.trim(), name: from[1]!.trim() } : { email: m.from },
          subject: m.subject,
          content: [
            { type: "text/plain", value: m.text },
            { type: "text/html", value: m.html },
          ],
          attachments: [
            {
              content: m.attachment.bytes.toString("base64"),
              filename: m.attachment.filename,
              type: m.attachment.mime,
              disposition: "attachment",
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`SendGrid HTTP ${res.status}`);
    },
  };
}

export function createSmtpProvider(smtpUrl: string): EmailProvider {
  if (!smtpUrl) throw new Error("SMTP_URL manquant");
  return {
    name: "smtp",
    async send(m: EmailMessage) {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport(smtpUrl);
      await transport.sendMail({
        from: m.from,
        to: m.to,
        subject: m.subject,
        text: m.text,
        html: m.html,
        attachments: [{ filename: m.attachment.filename, content: m.attachment.bytes, contentType: m.attachment.mime }],
      });
    },
  };
}

/** Fournisseur de développement : n'envoie rien, journalise seulement (sans l'adresse). */
export function createLogProvider(): EmailProvider {
  return {
    name: "log",
    async send(m: EmailMessage) {
      console.log(`[email:log] envoi simulé — sujet="${m.subject}" pièce jointe=${Math.round(m.attachment.bytes.length / 1024)} Ko`);
      await new Promise((r) => setTimeout(r, 600));
    },
  };
}
