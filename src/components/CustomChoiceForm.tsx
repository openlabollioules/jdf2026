"use client";

import { useState, type FormEvent } from "react";
import { cleanCustomChoice, CUSTOM_CHOICE_MAX } from "@/config/choices";
import { texts } from "@/config/texts";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { PrimaryButton } from "./PrimaryButton";

/**
 * Saisie libre (clavier tactile intégré ou clavier physique).
 * Même validation que le serveur : longueur, caractères autorisés, mots refusés.
 */
export function CustomChoiceForm({ kind, initial = "", onSubmit, onCancel }: { kind: "animal" | "movement" | "power"; initial?: string; onSubmit: (text: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const check = cleanCustomChoice(value);
    if (!check.ok) {
      setError(texts.customChoice.errors[check.reason]);
      return;
    }
    onSubmit(check.value);
  };

  const type = (s: string) => {
    setError(null);
    setValue((v) => (v + s).slice(0, CUSTOM_CHOICE_MAX));
  };

  return (
    <div className="modal-overlay">
      <form className="modal custom-power-form" onSubmit={submit} noValidate>
        <h2>{texts.customChoice[kind].title}</h2>
        <div className="text-field-wrap">
          <input
            className={`text-field${error ? " is-invalid" : ""}`}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={CUSTOM_CHOICE_MAX}
            placeholder={texts.customChoice[kind].placeholder}
            value={value}
            onChange={(e) => {
              setError(null);
              setValue(e.target.value);
            }}
            aria-invalid={!!error}
            aria-label={texts.customChoice[kind].title}
          />
          <span className="text-counter">
            {value.length}/{CUSTOM_CHOICE_MAX}
          </span>
        </div>
        {error && <p className="form-error">{error}</p>}
        <p className="privacy-note">{texts.customChoice.privacy}</p>
        <OnScreenKeyboard layout="text" onKey={type} onBackspace={() => setValue((v) => v.slice(0, -1))} />
        <div className="form-actions">
          <PrimaryButton variant="ghost" size="md" onPress={onCancel}>
            {texts.customChoice.cancel}
          </PrimaryButton>
          <PrimaryButton size="lg" onPress={() => submit()} disabled={value.trim().length === 0}>
            {texts.customChoice.cta}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
