"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import type { PublicConfig } from "@/lib/publicConfig";
import { sessionChoices, type DroneSession, type SessionAction } from "@/lib/session/machine";
import { ApiError, cancelGeneration, createGeneration, getGeneration, preloadImage } from "./api";
import { toOverrides, type DevSettings } from "./devSettings";

const POLL_MS = 700;
const MAX_POLL_FAILURES = 10;
const MAX_CREATE_TRIES = 4;

interface Run {
  sessionId: string;
  attempt: number;
  abort: AbortController;
  generationId?: string;
  done: boolean;
}

export interface GenerationTimings {
  requestedAt?: number;
  createdAt?: number;
  readyAt?: number;
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * Pilote la génération : création (idempotente), polling, préchargement de l'image,
 * tolérance aux coupures réseau, timeout, et annulation propre lors d'un reset.
 * Toutes les réponses sont étiquetées par `attempt` : une réponse obsolète est ignorée.
 */
export function useGenerationController(
  state: DroneSession,
  dispatch: Dispatch<SessionAction>,
  config: PublicConfig,
  getDev: () => DevSettings | null,
) {
  const runRef = useRef<Run | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [timings, setTimings] = useState<GenerationTimings>({});

  const wantsRun = state.status === "generating" && state.generationStatus === "pending";

  useEffect(() => {
    const cur = runRef.current;
    const isCurrent = cur && cur.attempt === state.generationAttempt && cur.sessionId === state.sessionId;

    if (cur && !cur.done && (!wantsRun || !isCurrent)) {
      cur.abort.abort();
      if (cur.generationId) cancelGeneration(cur.generationId);
      runRef.current = null;
    }
    if (!wantsRun || (runRef.current && isCurrent)) return;

    const run: Run = { sessionId: state.sessionId, attempt: state.generationAttempt, abort: new AbortController(), done: false };
    runRef.current = run;
    void execute(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsRun, state.generationAttempt, state.sessionId]);

  useEffect(
    () => () => {
      runRef.current?.abort.abort();
    },
    [],
  );

  async function execute(run: Run) {
    const { signal } = run.abort;
    const s = stateRef.current;
    const deadline = Date.now() + config.generationTimeoutMs + 5000;
    setTimings({ requestedAt: Date.now() });
    const fail = (retryable: boolean) => {
      run.done = true;
      dispatch({ type: "GENERATION_FAILED", attempt: run.attempt, retryable });
    };

    try {
      const choices = sessionChoices(s);
      if (!s.capturedImage || !choices) return fail(false);

      // 1. Création — l'identifiant de requête rend les renvois sans danger.
      let generationId = "";
      for (let i = 1; ; i++) {
        try {
          const dev = getDev();
          const res = await createGeneration(
            {
              image: s.capturedImage,
              ...choices,
              requestId: `${run.sessionId}-${run.attempt}`,
              captureConfirmedAt: s.captureConfirmedAt,
              retry: run.attempt > 1,
              dev: dev ? toOverrides(dev) : undefined,
            },
            signal,
          );
          generationId = res.generationId;
          break;
        } catch (err) {
          if (signal.aborted) return;
          const retryable = !(err instanceof ApiError) || err.retryable;
          if (!retryable || i >= MAX_CREATE_TRIES || Date.now() > deadline) return fail(retryable);
          await sleep(800 * i, signal);
        }
      }
      run.generationId = generationId;
      dispatch({ type: "GENERATION_CREATED", attempt: run.attempt, generationId });
      setTimings((t) => ({ ...t, createdAt: Date.now() }));

      // 2. Polling tolérant aux micro-coupures réseau.
      let failures = 0;
      for (;;) {
        if (Date.now() > deadline) {
          cancelGeneration(generationId);
          return fail(true);
        }
        await sleep(POLL_MS, signal);
        try {
          const r = await getGeneration(generationId, signal);
          failures = 0;
          if (r.status === "failed") return fail(r.retryable);
          if (r.status === "succeeded") {
            // 3. Préchargement avant d'autoriser la remontée du sous-marin.
            await preloadImage(r.imageUrl, signal);
            run.done = true;
            setTimings((t) => ({ ...t, readyAt: Date.now() }));
            dispatch({ type: "GENERATION_SUCCEEDED", attempt: run.attempt, imageUrl: r.imageUrl });
            return;
          }
        } catch (err) {
          if (signal.aborted) return;
          if (++failures >= MAX_POLL_FAILURES) throw err;
        }
      }
    } catch {
      if (!signal.aborted) fail(true);
    }
  }

  return { timings };
}
