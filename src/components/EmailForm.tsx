"use client";

import { useState, type Dispatch, type FormEvent } from "react";
import { texts } from "@/config/texts";
import type { DroneSession, SessionAction } from "@/lib/session/machine";
import { sendEmail } from "@/lib/client/api";
import { sound } from "@/lib/client/sound";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { PrimaryButton } from "./PrimaryButton";

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/**
 * Option secondaire : envoi par e-mail à un parent. L'adresse n'est demandée qu'ici,
 * envoyée au backend pour cet unique envoi, et jamais conservée côté client.
 */
export function EmailForm({ session, dispatch }: { session: DroneSession; dispatch: Dispatch<SessionAction> }) {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const status = session.email.status;
  const sending = status === "sending";

  if (session.status === "complete") {
    return (
      <div className="modal-overlay">
        <div className="modal email-done" role="status">
          <p className="email-success">{texts.email.success}</p>
          <PrimaryButton size="lg" onPress={() => dispatch({ type: "BACK_TO_RESULT" })}>
            OK 👍
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (sending) return;
    const value = email.trim();
    if (!EMAIL_RE.test(value) || !session.generationId) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    dispatch({ type: "EMAIL_SENDING" });
    try {
      await sendEmail(session.generationId, value);
      sound().play("reveal");
      setEmail("");
      dispatch({ type: "EMAIL_RESULT", ok: true });
    } catch {
      dispatch({ type: "EMAIL_RESULT", ok: false });
    }
  };

  return (
    <div className="modal-overlay">
      <form className="modal email-form" onSubmit={submit} noValidate>
        <h2>{texts.email.title}</h2>
        <input
          className={`email-input${invalid ? " is-invalid" : ""}`}
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          placeholder={texts.email.placeholder}
          value={email}
          disabled={sending}
          onChange={(e) => {
            setEmail(e.target.value);
            setInvalid(false);
          }}
          aria-invalid={invalid}
        />
        {invalid && <p className="form-error">{texts.email.invalid}</p>}
        {status === "failed" && <p className="form-error">{texts.email.failure}</p>}
        <OnScreenKeyboard
          disabled={sending}
          onKey={(k) => {
            setInvalid(false);
            setEmail((v) => (v + k).slice(0, 254));
          }}
          onBackspace={() => setEmail((v) => v.slice(0, -1))}
        />
        <div className="email-actions">
          <PrimaryButton variant="ghost" size="md" onPress={() => dispatch({ type: "CLOSE_EMAIL" })} disabled={sending}>
            {texts.email.cancel}
          </PrimaryButton>
          <PrimaryButton size="lg" onPress={() => void submit()} disabled={sending || email.length === 0} cooldownMs={1500}>
            {sending ? texts.email.sending : texts.email.cta}
          </PrimaryButton>
        </div>
        <p className="privacy-note">{texts.email.privacy}</p>
      </form>
    </div>
  );
}
