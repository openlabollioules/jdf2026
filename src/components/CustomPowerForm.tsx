"use client";

import { useState, type FormEvent } from "react";
import { cleanCustomPower } from "@/config/choices";
import { CUSTOM_POWER_MAX } from "@/config/powers";
import { texts } from "@/config/texts";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { PrimaryButton } from "./PrimaryButton";

/**
 * Saisie du pouvoir inventé (clavier tactile intégré ou clavier physique).
 * Même validation que le serveur : longueur, caractères autorisés, mots refusés.
 */
export function CustomPowerForm({ initial = "", onSubmit, onCancel }: { initial?: string; onSubmit: (text: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const check = cleanCustomPower(value);
    if (!check.ok) {
      setError(texts.customPower.errors[check.reason]);
      return;
    }
    onSubmit(check.value);
  };

  const type = (s: string) => {
    setError(null);
    setValue((v) => (v + s).slice(0, CUSTOM_POWER_MAX));
  };

  return (
    <div className="modal-overlay">
      <form className="modal custom-power-form" onSubmit={submit} noValidate>
        <h2>{texts.customPower.title}</h2>
        <div className="text-field-wrap">
          <input
            className={`text-field${error ? " is-invalid" : ""}`}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={CUSTOM_POWER_MAX}
            placeholder={texts.customPower.placeholder}
            value={value}
            onChange={(e) => {
              setError(null);
              setValue(e.target.value);
            }}
            aria-invalid={!!error}
          />
          <span className="text-counter">
            {value.length}/{CUSTOM_POWER_MAX}
          </span>
        </div>
        {error && <p className="form-error">{error}</p>}
        <OnScreenKeyboard layout="text" onKey={type} onBackspace={() => setValue((v) => v.slice(0, -1))} />
        <div className="form-actions">
          <PrimaryButton variant="ghost" size="md" onPress={onCancel}>
            {texts.customPower.cancel}
          </PrimaryButton>
          <PrimaryButton size="lg" onPress={() => submit()} disabled={value.trim().length === 0}>
            {texts.customPower.cta}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
