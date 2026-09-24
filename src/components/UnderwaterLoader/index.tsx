"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { texts } from "@/config/texts";
import { branding } from "@/config/branding";
import {
  createScene,
  markResultReady,
  sceneMessage,
  stepScene,
  timelineWith,
  type ScenePhase,
} from "@/lib/scene/sceneMachine";
import { sound } from "@/lib/client/sound";
import type { GenerationTimings } from "@/lib/client/useGenerationController";
import { cameraY, LAB_HATCH, SUB_AT_LAB, subPose, VIEW } from "./geometry";
import { Ocean } from "./Ocean";
import { Fish } from "./Fish";
import { Laboratory } from "./Laboratory";
import { Capsule, Submarine } from "./Submarine";
import { Splash } from "./Bubbles";
import { LoadingMessages } from "./LoadingMessages";

interface Props {
  /** Vrai quand l'image est générée ET préchargée. Seule source de vérité pour la remontée. */
  resultReady: boolean;
  minDurationMs: number;
  onFinished: () => void;
  showTimings?: boolean;
  timingsExtra?: GenerationTimings;
}

const TICK_MS = 100;

const PHASE_SOUNDS: Partial<Record<ScenePhase, Parameters<ReturnType<typeof sound>["play"]>[0]>> = {
  diving: "dive",
  laboratory: "spark",
  "result-ready": "reveal",
  surfacing: "whoosh",
  reveal: "splash",
};

/**
 * Mini-aventure sous-marine affichée pendant la génération.
 * Démarre instantanément (SVG intégré, aucun chargement réseau) et reste vivante
 * aussi longtemps que nécessaire grâce à la machine d'état `sceneMachine`.
 */
export function UnderwaterLoader({ resultReady, minDurationMs, onFinished, showTimings, timingsExtra }: Props) {
  const timeline = useMemo(() => timelineWith(minDurationMs), [minDurationMs]);
  const [scene, setScene] = useState(() => createScene(performance.now()));
  const [now, setNow] = useState(() => performance.now());
  const readyRef = useRef(resultReady);
  readyRef.current = resultReady;
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  // Horloge de la scène (nettoyée au démontage).
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = performance.now();
      setScene((s) => stepScene(readyRef.current ? markResultReady(s) : s, t, timeline));
      setNow(t);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [timeline]);

  useEffect(() => {
    const snd = PHASE_SOUNDS[scene.phase];
    if (snd) sound().play(snd);
    if (scene.phase === "done") finishedRef.current();
  }, [scene.phase]);

  const { phase } = scene;
  const pose = subPose(phase);
  const camY = cameraY(phase);
  const transitionMs =
    phase === "diving" ? timeline.divingMs : phase === "surfacing" ? timeline.surfacingMs : phase === "reveal" ? 500 : 700;
  const easing =
    phase === "diving" ? "cubic-bezier(.45,.05,.55,.95)" : phase === "surfacing" ? "cubic-bezier(.45,0,.55,1)" : "ease-out";
  const cameraStyle: CSSProperties = {
    transform: `translateY(${-camY}px)`,
    transition: `transform ${transitionMs}ms ${easing}`,
  };

  const message = sceneMessage(scene, now, texts.scene, timeline);
  const capsuleInTransit = phase === "result-ready";
  const capsuleOnSub = phase === "surfacing" || phase === "reveal" || phase === "done";
  const deep = phase === "laboratory" || phase === "waiting" || phase === "result-ready" || phase === "diving";

  return (
    <section className={`underwater phase-${phase}`} aria-label="Ton drone est en construction">
      <svg className="scene-svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7fbdf2" />
            <stop offset="1" stopColor="#e6f4ff" />
          </linearGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2fa3e6" />
            <stop offset="0.25" stopColor="#1668c4" />
            <stop offset="0.65" stopColor="#0a3688" />
            <stop offset="1" stopColor="#061a4a" />
          </linearGradient>
          <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a5f93" />
            <stop offset="1" stopColor="#10285a" />
          </linearGradient>
          <radialGradient id="dome" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#bfefff" stopOpacity="0.55" />
            <stop offset="0.7" stopColor="#4fb8e8" stopOpacity="0.35" />
            <stop offset="1" stopColor="#1d6fc0" stopOpacity="0.5" />
          </radialGradient>
          <linearGradient id="lab-steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#b9c8e2" />
          </linearGradient>
          <linearGradient id="lab-deck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b3a86" />
            <stop offset="1" stopColor="#0b1b3f" />
          </linearGradient>
          <linearGradient id="arm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2f6fc" />
            <stop offset="1" stopColor="#9fb1d2" />
          </linearGradient>
          <linearGradient id="sub-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#c9d6ec" />
          </linearGradient>
          <linearGradient id="sub-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a3aa8" />
            <stop offset="1" stopColor="#001f6b" />
          </linearGradient>
          <linearGradient id="sub-sail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d7e1f2" />
          </linearGradient>
          <linearGradient id="sub-visor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#12306e" />
            <stop offset="1" stopColor="#030e2b" />
          </linearGradient>
          <linearGradient id="sub-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#dff6ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#dff6ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ray-fade" gradientUnits="userSpaceOnUse" x1="0" y1="260" x2="0" y2="1560">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="capsule-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#bdf0ff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#5FD4FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="world" style={cameraStyle}>
          <Ocean />
          <Fish scatter={phase === "surfacing"} />
          <Laboratory phase={phase} />

          {capsuleInTransit && (
            <g className="capsule-transit" style={{ "--from-x": `${LAB_HATCH.x}px`, "--from-y": `${LAB_HATCH.y}px`, "--to-x": `${SUB_AT_LAB.x - 6}px`, "--to-y": `${SUB_AT_LAB.y + 78}px` } as CSSProperties}>
              <Capsule />
            </g>
          )}

          <Submarine
            phase={phase}
            pose={pose}
            transitionMs={phase === "surfacing" ? Math.round(transitionMs * 0.8) : transitionMs}
            easing={phase === "surfacing" ? "cubic-bezier(.6,0,.8,.4)" : easing}
            withCapsule={capsuleOnSub}
          />

          {(phase === "reveal" || phase === "done") && <Splash x={pose.x} y={pose.y + 20} />}
        </g>
        <rect className="scene-depth" x="0" y="0" width={VIEW.w} height={VIEW.h} fill="#030e2b" style={{ opacity: deep ? 0.1 : 0 }} />
      </svg>

      <LoadingMessages message={message} />
      <div className="scene-watermark" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src={branding.logo.src} alt="" />
      </div>
      <div className={`scene-flash${phase === "reveal" || phase === "done" ? " is-on" : ""}`} aria-hidden />

      {showTimings && (
        <div className="dev-timings">
          <div>phase : {phase}</div>
          <div>scène : {((now - scene.startedAt) / 1000).toFixed(1)} s</div>
          <div>résultat prêt : {resultReady ? "oui" : "non"}</div>
          {timingsExtra?.requestedAt && timingsExtra.createdAt && (
            <div>création : {timingsExtra.createdAt - timingsExtra.requestedAt} ms</div>
          )}
          {timingsExtra?.requestedAt && timingsExtra.readyAt && (
            <div>génération + préchargement : {((timingsExtra.readyAt - timingsExtra.requestedAt) / 1000).toFixed(1)} s</div>
          )}
        </div>
      )}
    </section>
  );
}
