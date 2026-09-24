"use client";

const LAYOUTS = {
  email: {
    rows: [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
      ["w", "x", "c", "v", "b", "n", "-", "_", ".", "@"],
    ],
    shortcuts: ["@gmail.com", "@orange.fr", "@free.fr", "@hotmail.fr", "@yahoo.fr", ".fr", ".com"],
    space: false,
  },
  text: {
    rows: [
      ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
      ["w", "x", "c", "v", "b", "n", "é", "è", "à", "ç"],
      ["'", "-", "ê", "ù", "!", "?"],
    ],
    shortcuts: [] as string[],
    space: true,
  },
};

/** Clavier AZERTY simplifié pour écran tactile (adresse e-mail ou texte libre). */
export function OnScreenKeyboard({
  onKey,
  onBackspace,
  disabled,
  layout = "email",
}: {
  onKey: (s: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  layout?: keyof typeof LAYOUTS;
}) {
  const l = LAYOUTS[layout];
  return (
    <div className="osk" aria-label="Clavier">
      {l.rows.map((row, i) => (
        <div className="osk-row" key={i}>
          {row.map((k) => (
            <button key={k} type="button" className="osk-key" disabled={disabled} onClick={() => onKey(k)}>
              {k}
            </button>
          ))}
          {i === 0 && (
            <button type="button" className="osk-key osk-wide" disabled={disabled} onClick={onBackspace} aria-label="Effacer">
              ⌫
            </button>
          )}
          {l.space && i === l.rows.length - 1 && (
            <button type="button" className="osk-key osk-space" disabled={disabled} onClick={() => onKey(" ")} aria-label="Espace">
              espace
            </button>
          )}
        </div>
      ))}
      {l.shortcuts.length > 0 && (
        <div className="osk-row">
          {l.shortcuts.map((k) => (
            <button key={k} type="button" className="osk-key osk-shortcut" disabled={disabled} onClick={() => onKey(k)}>
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
