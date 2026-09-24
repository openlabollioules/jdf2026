"use client";

import { useEffect, useRef } from "react";

/**
 * Appelle `onIdle` après `ms` sans interaction (toucher, clic, clavier).
 * `ms = null` désactive le minuteur. Le minuteur est réarmé à chaque changement de `resetKey`.
 */
export function useIdleTimer(ms: number | null, onIdle: () => void, resetKey: unknown) {
  const cb = useRef(onIdle);
  cb.current = onIdle;

  useEffect(() => {
    if (ms === null) return;
    let timer = setTimeout(() => cb.current(), ms);
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => cb.current(), ms);
    };
    const events = ["pointerdown", "keydown", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [ms, resetKey]);
}
