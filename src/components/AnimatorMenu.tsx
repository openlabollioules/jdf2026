"use client";

import { useEffect, useRef, useState } from "react";
import { texts } from "@/config/texts";
import type { SessionStatus } from "@/lib/session/machine";

const HOLD_MS = 700;

interface Props {
  status: SessionStatus;
  canRegenerate: boolean;
  onBack: () => void;
  onHome: () => void;
  onRegenerate: () => void;
}

/**
 * Bouton discret pour l'animateur (coin supérieur gauche).
 * Au toucher : maintenir appuyé ~0,7 s pour ouvrir (évite les appuis accidentels des enfants).
 * Au clavier : Entrée/Espace sur le bouton, ou touche Échap n'importe où.
 */
export function AnimatorMenu({ status, canRegenerate, onBack, onHome, onRegenerate }: Props) {
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setOpen(false), [status]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const startHold = () => {
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      setOpen(true);
    }, HOLD_MS);
  };
  const cancelHold = () => {
    setHolding(false);
    if (timer.current) clearTimeout(timer.current);
  };

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const canBack = !["welcome", "generating", "result"].includes(status);

  return (
    <>
      <button
        type="button"
        className={`corner-btn corner-left animator-trigger${holding ? " is-holding" : ""}`}
        aria-label={texts.animator.open}
        title={texts.animator.holdHint}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span aria-hidden>⚙︎</span>
      </button>
      {open && (
        <div className="animator-overlay" role="dialog" aria-modal="true" aria-label={texts.animator.open} onClick={() => setOpen(false)}>
          <div className="animator-menu" onClick={(e) => e.stopPropagation()}>
            {canBack && (
              <button type="button" onClick={run(onBack)} autoFocus>
                {texts.animator.back}
              </button>
            )}
            <button type="button" onClick={run(onHome)} autoFocus={!canBack}>
              {texts.animator.home}
            </button>
            {canRegenerate && (
              <button type="button" onClick={run(onRegenerate)}>
                {texts.animator.regenerate}
              </button>
            )}
            <button
              type="button"
              onClick={run(() => {
                if (document.fullscreenElement) void document.exitFullscreen();
                else void document.documentElement.requestFullscreen?.().catch(() => undefined);
              })}
            >
              {texts.animator.fullscreen}
            </button>
            <button type="button" className="animator-close" onClick={() => setOpen(false)}>
              {texts.animator.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
