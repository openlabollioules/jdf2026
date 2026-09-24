"use client";

/**
 * Sons synthétisés avec WebAudio (aucun fichier à charger).
 * L'expérience ne dépend jamais du son : tout est aussi visible à l'écran.
 * Pour utiliser de vrais fichiers audio plus tard, remplacer `play()` par
 * un chargement de buffers : l'API des composants ne change pas.
 */
export type SoundName = "tap" | "bubble" | "dive" | "spark" | "whoosh" | "splash" | "reveal" | "shutter" | "beep";

const STORAGE_KEY = "drone:muted";

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private listeners = new Set<(m: boolean) => void>();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.muted = window.localStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        /* stockage indisponible */
      }
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      window.localStorage.setItem(STORAGE_KEY, m ? "1" : "0");
    } catch {
      /* ignore */
    }
    this.listeners.forEach((l) => l(m));
  }

  subscribe(l: (m: boolean) => void) {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  }

  private context(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; to?: number; delay?: number } = {}) {
    const ctx = this.context();
    if (!ctx) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.15, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, gain = 0.2, filterFreq = 1200) {
    const ctx = this.context();
    if (!ctx) return;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start();
  }

  play(name: SoundName) {
    if (this.muted) return;
    try {
      switch (name) {
        case "tap":
          return this.tone(660, 0.12, { type: "triangle", to: 990, gain: 0.12 });
        case "beep":
          return this.tone(880, 0.15, { type: "square", gain: 0.05 });
        case "bubble":
          return this.tone(300 + Math.random() * 300, 0.15, { to: 900, gain: 0.08 });
        case "dive":
          this.tone(500, 0.8, { to: 120, gain: 0.08, type: "triangle" });
          return this.noise(0.6, 0.06, 600);
        case "spark":
          this.tone(1800, 0.08, { type: "square", gain: 0.04 });
          return this.tone(2400, 0.08, { type: "square", gain: 0.03, delay: 0.09 });
        case "whoosh":
          return this.noise(0.9, 0.15, 2000);
        case "splash":
          return this.noise(0.7, 0.35, 1500);
        case "shutter":
          return this.noise(0.12, 0.3, 4000);
        case "reveal":
          [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, { type: "triangle", gain: 0.12, delay: i * 0.09 }));
          return;
      }
    } catch {
      /* le son n'est jamais bloquant */
    }
  }
}

let instance: SoundManager | null = null;
export function sound(): SoundManager {
  if (!instance) instance = new SoundManager();
  return instance;
}
