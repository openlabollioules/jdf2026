"use client";

import { useEffect, useState, type Dispatch } from "react";
import { animals, movements, powers } from "@/config/choices";
import { MODEL_ADAPTERS } from "@/lib/generation/models";
import type { PublicConfig } from "@/lib/publicConfig";
import type { SessionAction, SessionStatus } from "@/lib/session/machine";
import { imageUrlToCapture } from "@/lib/client/capture";
import { newSessionId } from "@/lib/client/ids";
import type { DevSettings } from "@/lib/client/devSettings";
import { UnderwaterLoader } from "./UnderwaterLoader";

const SAMPLES = ["/samples/sketch-drone.svg", "/samples/sketch-fish.svg"];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

interface Props {
  settings: DevSettings;
  onChange: (s: DevSettings) => void;
  dispatch: Dispatch<SessionAction>;
  config: PublicConfig;
  sessionStatus: SessionStatus;
}

/** Outils de test (DEV_TOOLS=true uniquement) : jamais rendus en production par défaut. */
export function DevPanel({ settings, onChange, dispatch, config, sessionStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [demo, setDemo] = useState<{ key: number; ready: boolean } | null>(null);
  const [stats, setStats] = useState<string>("");
  const [sample, setSample] = useState(0);

  const set = (patch: Partial<DevSettings>) => onChange({ ...settings, ...patch });

  const loadSample = async (thenGenerate: boolean) => {
    const src = SAMPLES[sample % SAMPLES.length]!;
    setSample((s) => s + 1);
    const image = await imageUrlToCapture(src, { aspect: config.camera.aspect, maxSize: config.camera.maxSize });
    dispatch({
      type: "DEV_LOAD_SKETCH",
      sessionId: newSessionId(),
      image,
      animal: pick(animals).id,
      movement: pick(movements).id,
      power: pick(powers).id,
    });
    if (thenGenerate) dispatch({ type: "CONFIRM_PHOTO", at: Date.now() });
    setOpen(false);
  };

  // Rejouer uniquement l'animation, avec un délai simulé.
  useEffect(() => {
    if (!demo || demo.ready) return;
    const delay = settings.simulate === "off" || settings.simulate === "error" ? 8000 : Number(settings.simulate);
    const t = window.setTimeout(() => setDemo((d) => (d ? { ...d, ready: true } : d)), delay);
    return () => window.clearTimeout(t);
  }, [demo, settings.simulate]);

  const loadStats = async () => {
    try {
      const r = await fetch("/api/stats", { cache: "no-store" });
      setStats(JSON.stringify(await r.json(), null, 2));
    } catch {
      setStats("indisponible");
    }
  };

  return (
    <>
      <button type="button" className="dev-toggle" onClick={() => setOpen((o) => !o)} aria-label="Outils de développement">
        🛠
      </button>
      {open && (
        <div className="dev-panel">
          <h3>Outils de test {config.mockMode && <em>(mode mock : pas de token Replicate)</em>}</h3>
          <label>
            Réponse de génération
            <select value={settings.simulate} onChange={(e) => set({ simulate: e.target.value as DevSettings["simulate"] })}>
              <option value="off">{config.mockMode ? "Mock (MOCK_DELAY_MS)" : "Réelle (Replicate)"}</option>
              <option value="2000">Simulée 2 s</option>
              <option value="8000">Simulée 8 s</option>
              <option value="15000">Simulée 15 s</option>
              <option value="error">Simulée : erreur</option>
            </select>
          </label>
          <label>
            Modèle
            <select value={settings.model} onChange={(e) => set({ model: e.target.value })}>
              <option value="">Par défaut (REPLICATE_MODEL)</option>
              {MODEL_ADAPTERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="dev-check">
            <input type="checkbox" checked={settings.showTimings} onChange={(e) => set({ showTimings: e.target.checked })} />
            Afficher les timings
          </label>
          <div className="dev-actions">
            <button type="button" onClick={() => void loadSample(false)}>
              Croquis d&apos;exemple → aperçu
            </button>
            <button type="button" onClick={() => void loadSample(true)}>
              Croquis d&apos;exemple → génération directe
            </button>
            <button
              type="button"
              disabled={sessionStatus === "generating"}
              onClick={() => {
                setDemo({ key: Date.now(), ready: false });
                setOpen(false);
              }}
            >
              Rejouer seulement l&apos;animation
            </button>
            <button type="button" onClick={() => void loadStats()}>
              Statistiques serveur
            </button>
          </div>
          {stats && <pre className="dev-stats">{stats}</pre>}
        </div>
      )}
      {demo && (
        <div className="dev-demo">
          <UnderwaterLoader
            key={demo.key}
            resultReady={demo.ready}
            minDurationMs={config.sceneMinMs}
            onFinished={() => setDemo(null)}
            showTimings={settings.showTimings}
          />
          <button type="button" className="dev-demo-close" onClick={() => setDemo(null)}>
            ✕
          </button>
        </div>
      )}
    </>
  );
}
