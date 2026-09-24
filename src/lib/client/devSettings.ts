"use client";

import type { DevOverrides } from "./api";

/** Réglages du panneau développeur, mémorisés localement (jamais utilisés en production). */
export interface DevSettings {
  simulate: "off" | "2000" | "8000" | "15000" | "error";
  model: string;
  showTimings: boolean;
}

const KEY = "drone:dev";
const DEFAULTS: DevSettings = { simulate: "off", model: "", showTimings: false };

export function loadDevSettings(): DevSettings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<DevSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveDevSettings(s: DevSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function toOverrides(s: DevSettings): DevOverrides | undefined {
  const o: DevOverrides = {};
  if (s.model) o.model = s.model;
  if (s.simulate === "error") o.simulate = { delayMs: 3000, fail: true };
  else if (s.simulate !== "off") o.simulate = { delayMs: Number(s.simulate) };
  return o.model || o.simulate ? o : undefined;
}
