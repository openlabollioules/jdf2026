"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { animals, movements } from "@/config/choices";
import { branding } from "@/config/branding";
import { texts } from "@/config/texts";
import type { PublicConfig } from "@/lib/publicConfig";
import { createSession, sessionReducer, type SessionAction } from "@/lib/session/machine";
import { loadDevSettings, saveDevSettings, type DevSettings } from "@/lib/client/devSettings";
import { reportEvent } from "@/lib/client/api";
import { newSessionId } from "@/lib/client/ids";
import { sound } from "@/lib/client/sound";
import { useGenerationController } from "@/lib/client/useGenerationController";
import { useShareController } from "@/lib/client/useShareController";
import { useIdleTimer } from "@/lib/client/useIdleTimer";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChoiceScreen } from "./ChoiceScreen";
import { SummaryScreen } from "./SummaryScreen";
import { DrawingInstructions } from "./DrawingInstructions";
import { CameraCapture } from "./CameraCapture";
import { UnderwaterLoader } from "./UnderwaterLoader";
import { DroneReveal } from "./DroneReveal";
import { EmailForm } from "./EmailForm";
import { ErrorScreen } from "./ErrorScreen";
import { AnimatorMenu } from "./AnimatorMenu";
import { MuteButton } from "./MuteButton";
import { DevPanel } from "./DevPanel";
import { Backdrop } from "./Backdrop";
import { BrandHeader } from "./BrandHeader";
import { PowerScreen } from "./PowerScreen";

/** Délai pendant lequel un nouvel écran ignore les appuis (anti double-tap « traversant »). */
const INPUT_LOCK_MS = 450;

export function Kiosk({ config }: { config: PublicConfig }) {
  const [state, rawDispatch] = useReducer(sessionReducer, undefined, () => createSession(newSessionId()));
  const [devSettings, setDevSettings] = useState<DevSettings>({ simulate: "off", model: "", showTimings: false });
  const devRef = useRef(devSettings);
  devRef.current = devSettings;

  useEffect(() => {
    if (config.devTools) setDevSettings(loadDevSettings());
  }, [config.devTools]);

  const updateDevSettings = useCallback((s: DevSettings) => {
    setDevSettings(s);
    saveDevSettings(s);
  }, []);

  // --- Verrou d'entrée à chaque changement d'écran -------------------------------------
  const enteredAt = useRef(0);
  const lastStatus = useRef(state.status);
  if (lastStatus.current !== state.status) {
    lastStatus.current = state.status;
    enteredAt.current = typeof performance !== "undefined" ? performance.now() : 0;
  }

  /** Actions déclenchées par un appui de l'enfant (soumises au verrou anti double-tap). */
  const act = useCallback((action: SessionAction) => {
    if (performance.now() - enteredAt.current < INPUT_LOCK_MS) return;
    rawDispatch(action);
  }, []);

  const reset = useCallback(() => rawDispatch({ type: "RESET", sessionId: newSessionId() }), []);

  // --- Contrôleurs asynchrones (génération, partage, inactivité) ------------------------
  const generation = useGenerationController(state, rawDispatch, config, () => (config.devTools ? devRef.current : null));
  useShareController(state, rawDispatch, config);

  const idleMs =
    state.status === "result" || state.status === "complete" || state.status === "email"
      ? config.resultIdleMs
      : state.status === "welcome" || state.status === "generating"
        ? null
        : config.questionIdleMs;
  useIdleTimer(idleMs, reset, state.status);

  // Instrumentation : début de la révélation.
  const reportedReveal = useRef<string | null>(null);
  useEffect(() => {
    if (state.status === "result" && state.generationId && reportedReveal.current !== state.generationId) {
      reportedReveal.current = state.generationId;
      reportEvent(state.generationId, "reveal_started");
    }
  }, [state.status, state.generationId]);

  const onSceneFinished = useCallback(() => rawDispatch({ type: "SCENE_FINISHED" }), []);
  const eventName = config.eventName || branding.eventName;

  // --- Rendu de l'écran courant ------------------------------------------------------------
  const screen = useMemo(() => {
    switch (state.status) {
      case "welcome":
        return (
          <WelcomeScreen
            eventName={eventName}
            onStart={() => {
              sound().play("tap");
              act({ type: "START", sessionId: newSessionId() });
            }}
          />
        );
      case "animal":
        return <ChoiceScreen question={texts.questions.animal} options={animals} onChoose={(id) => act({ type: "CHOOSE_ANIMAL", animal: id })} />;
      case "movement":
        return <ChoiceScreen question={texts.questions.movement} options={movements} onChoose={(id) => act({ type: "CHOOSE_MOVEMENT", movement: id })} />;
      case "power":
        return <PowerScreen initialCustom={state.customPower} onChoose={(power, customPower) => act({ type: "CHOOSE_POWER", power, customPower })} />;
      case "summary":
        return <SummaryScreen session={state} onConfirm={() => act({ type: "CONFIRM_SUMMARY" })} />;
      case "drawing":
        return <DrawingInstructions onReady={() => act({ type: "OPEN_CAMERA" })} />;
      case "camera":
      case "preview":
        return (
          <CameraCapture
            config={config.camera}
            capturedImage={state.status === "preview" ? state.capturedImage : undefined}
            onCapture={(image) => rawDispatch({ type: "PHOTO_TAKEN", image })}
            onRetake={() => act({ type: "RETAKE" })}
            onConfirm={() => act({ type: "CONFIRM_PHOTO", at: Date.now() })}
            devTools={config.devTools}
            onDevImage={(image) => rawDispatch({ type: "PHOTO_TAKEN", image })}
          />
        );
      case "generating":
        return (
          <UnderwaterLoader
            key={`${state.sessionId}-${state.generationAttempt}`}
            resultReady={state.generationStatus === "ready"}
            minDurationMs={config.sceneMinMs}
            onFinished={onSceneFinished}
            showTimings={config.devTools && devSettings.showTimings}
            timingsExtra={generation.timings}
          />
        );
      case "result":
      case "email":
      case "complete":
        return (
          <DroneReveal
            session={state}
            config={config}
            onAgain={() => {
              sound().play("tap");
              reset();
            }}
            onEmail={() => act({ type: "OPEN_EMAIL" })}
          />
        );
      case "error":
        return <ErrorScreen retryable={state.retryable} onRetry={() => act({ type: "RETRY" })} onHome={reset} />;
    }
  }, [state, config, act, reset, onSceneFinished, devSettings.showTimings, generation.timings, eventName]);

  const showHeader = state.status !== "welcome" && state.status !== "generating";

  return (
    <main className={`kiosk${showHeader ? " has-header" : ""}`} data-status={state.status}>
      <Backdrop variant={state.status === "generating" ? "none" : state.status === "result" || state.status === "email" || state.status === "complete" ? "result" : "ocean"} />
      {showHeader && <BrandHeader eventName={eventName} status={state.status} />}
      <div className="screen" key={state.status === "preview" ? "camera" : state.status === "email" || state.status === "complete" ? "result" : state.status}>
        {screen}
      </div>
      {(state.status === "email" || state.status === "complete") && (
        <EmailForm session={state} dispatch={rawDispatch} />
      )}
      <AnimatorMenu
        status={state.status}
        canRegenerate={(state.status === "result" || state.status === "complete") && !!state.capturedImage}
        onBack={() => rawDispatch({ type: "BACK" })}
        onHome={reset}
        onRegenerate={() => rawDispatch({ type: "REGENERATE" })}
      />
      <MuteButton />
      {config.devTools && (
        <DevPanel
          settings={devSettings}
          onChange={updateDevSettings}
          dispatch={rawDispatch}
          config={config}
          sessionStatus={state.status}
        />
      )}
      <div className="rotate-hint" role="alert">
        <span>{texts.rotate}</span>
      </div>
    </main>
  );
}
