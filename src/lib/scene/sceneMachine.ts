/**
 * Machine d'état de la mini-scène sous-marine (§16–§21).
 *
 * La timeline n'est PAS la source de vérité pour la fin de la génération :
 * la remontée ne commence que lorsque `resultReady` est vrai, ET qu'un point
 * de sortie naturel est atteint (arrivée au labo + durée minimale d'expérience).
 *
 * Fonction pure pilotée par des « ticks » : facile à tester, aucune dépendance au DOM.
 */
export type ScenePhase =
  | "starting"
  | "diving"
  | "laboratory"
  | "waiting"
  | "result-ready"
  | "surfacing"
  | "reveal"
  | "done";

export interface SceneTimeline {
  startingMs: number;
  divingMs: number;
  /** Durée « normale » du passage au labo avant la boucle d'attente. */
  laboratoryMs: number;
  /** Temps minimum passé au labo avant de pouvoir repartir. */
  laboratoryMinMs: number;
  /** Durée minimale totale avant la remontée (génération très rapide, §21). */
  minTotalMs: number;
  handoffMs: number;
  surfacingMs: number;
  revealMs: number;
  /** Rythme d'alternance des messages d'attente. */
  waitingMessageMs: number;
}

export const DEFAULT_TIMELINE: SceneTimeline = {
  startingMs: 2000,
  divingMs: 2200,
  laboratoryMs: 3000,
  laboratoryMinMs: 1600,
  minTotalMs: 6500,
  handoffMs: 1500,
  surfacingMs: 1900,
  revealMs: 900,
  waitingMessageMs: 2600,
};

export interface SceneState {
  phase: ScenePhase;
  startedAt: number;
  phaseStartedAt: number;
  resultReady: boolean;
}

export function createScene(now: number): SceneState {
  return { phase: "starting", startedAt: now, phaseStartedAt: now, resultReady: false };
}

export function markResultReady(state: SceneState): SceneState {
  return state.resultReady ? state : { ...state, resultReady: true };
}

function to(state: SceneState, phase: ScenePhase, at: number): SceneState {
  return { ...state, phase, phaseStartedAt: at };
}

/** Fait avancer la scène jusqu'à `now` (plusieurs transitions possibles si le tick a pris du retard). */
export function stepScene(state: SceneState, now: number, t: SceneTimeline = DEFAULT_TIMELINE): SceneState {
  let s = state;
  for (let guard = 0; guard < 10; guard++) {
    const elapsed = now - s.phaseStartedAt;
    const total = now - s.startedAt;
    let next: SceneState | null = null;

    switch (s.phase) {
      case "starting":
        if (elapsed >= t.startingMs) next = to(s, "diving", s.phaseStartedAt + t.startingMs);
        break;
      case "diving":
        if (elapsed >= t.divingMs) next = to(s, "laboratory", s.phaseStartedAt + t.divingMs);
        break;
      case "laboratory":
        if (s.resultReady && elapsed >= t.laboratoryMinMs && total >= t.minTotalMs) {
          next = to(s, "result-ready", now);
        } else if (elapsed >= t.laboratoryMs) {
          next = to(s, "waiting", s.phaseStartedAt + t.laboratoryMs);
        }
        break;
      case "waiting":
        if (s.resultReady && total >= t.minTotalMs) next = to(s, "result-ready", now);
        break;
      case "result-ready":
        if (elapsed >= t.handoffMs) next = to(s, "surfacing", s.phaseStartedAt + t.handoffMs);
        break;
      case "surfacing":
        if (elapsed >= t.surfacingMs) next = to(s, "reveal", s.phaseStartedAt + t.surfacingMs);
        break;
      case "reveal":
        if (elapsed >= t.revealMs) next = to(s, "done", s.phaseStartedAt + t.revealMs);
        break;
      case "done":
        break;
    }
    if (!next) return s;
    s = next;
  }
  return s;
}

export interface SceneMessages {
  starting: string;
  diving: string;
  laboratory: readonly string[];
  waiting: readonly string[];
  resultReady: string;
  surfacing: string;
}

/** Message affiché pour l'état courant (alternance dans la boucle d'attente, jamais de pourcentage). */
export function sceneMessage(state: SceneState, now: number, m: SceneMessages, t: SceneTimeline = DEFAULT_TIMELINE): string {
  const elapsed = Math.max(0, now - state.phaseStartedAt);
  switch (state.phase) {
    case "starting":
      return m.starting;
    case "diving":
      return m.diving;
    case "laboratory": {
      const slot = Math.min(m.laboratory.length - 1, Math.floor(elapsed / (t.laboratoryMs / m.laboratory.length)));
      return m.laboratory[slot] ?? m.diving;
    }
    case "waiting":
      return m.waiting[Math.floor(elapsed / t.waitingMessageMs) % m.waiting.length] ?? m.laboratory[0]!;
    case "result-ready":
      return m.resultReady;
    default:
      return m.surfacing;
  }
}

/** Ajuste la timeline à la durée minimale configurée côté serveur. */
export function timelineWith(minTotalMs: number): SceneTimeline {
  return { ...DEFAULT_TIMELINE, minTotalMs };
}
