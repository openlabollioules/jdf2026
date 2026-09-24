import { describe, expect, it } from "vitest";
import { createScene, DEFAULT_TIMELINE as T, markResultReady, sceneMessage, stepScene, type SceneState } from "./sceneMachine";

function advance(s: SceneState, from: number, to: number, step = 100) {
  for (let t = from; t <= to; t += step) s = stepScene(s, t);
  return s;
}

const msgs = {
  starting: "start",
  diving: "dive",
  laboratory: ["lab1", "lab2"],
  waiting: ["w1", "w2", "w3"],
  resultReady: "ready",
  surfacing: "up",
};

describe("sceneMachine", () => {
  it("enchaîne départ → plongée → labo → attente sans résultat", () => {
    let s = createScene(0);
    s = advance(s, 0, 1900);
    expect(s.phase).toBe("starting");
    s = advance(s, 2000, 3000);
    expect(s.phase).toBe("diving");
    s = advance(s, 3100, 5000);
    expect(s.phase).toBe("laboratory");
    s = advance(s, 5100, 30_000);
    expect(s.phase).toBe("waiting"); // attente extensible, jamais de remontée sans résultat
  });

  it("ne révèle pas un résultat très rapide avant la durée minimale (§21)", () => {
    let s = createScene(0);
    s = advance(s, 0, 2500);
    s = markResultReady(s); // résultat reçu à 2,5 s, en pleine plongée
    s = advance(s, 2600, T.minTotalMs - 100);
    expect(["diving", "laboratory"]).toContain(s.phase);
    s = advance(s, T.minTotalMs - 100, T.minTotalMs + 100);
    expect(s.phase).toBe("result-ready");
  });

  it("remonte dès que le résultat arrive pendant la boucle d'attente", () => {
    let s = advance(createScene(0), 0, 20_000);
    expect(s.phase).toBe("waiting");
    s = markResultReady(s);
    s = stepScene(s, 20_100);
    expect(s.phase).toBe("result-ready");
    s = advance(s, 20_100, 20_100 + T.handoffMs);
    expect(s.phase).toBe("surfacing");
    s = advance(s, 20_100 + T.handoffMs, 20_100 + T.handoffMs + T.surfacingMs + T.revealMs + 200);
    expect(s.phase).toBe("done");
  });

  it("rattrape plusieurs phases si un tick arrive en retard (onglet en arrière-plan)", () => {
    const s = stepScene(createScene(0), 60_000);
    expect(s.phase).toBe("waiting");
  });

  it("alterne les messages d'attente sans pourcentage", () => {
    const s: SceneState = { phase: "waiting", startedAt: 0, phaseStartedAt: 10_000, resultReady: false };
    expect(sceneMessage(s, 10_000, msgs)).toBe("w1");
    expect(sceneMessage(s, 10_000 + T.waitingMessageMs, msgs)).toBe("w2");
    expect(sceneMessage(s, 10_000 + 3 * T.waitingMessageMs, msgs)).toBe("w1");
    const lab: SceneState = { ...s, phase: "laboratory" };
    expect(sceneMessage(lab, 10_000, msgs)).toBe("lab1");
    expect(sceneMessage(lab, 10_000 + T.laboratoryMs - 1, msgs)).toBe("lab2");
  });
});
