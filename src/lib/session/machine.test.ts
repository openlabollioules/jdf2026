import { describe, expect, it } from "vitest";
import { createSession, sessionReducer, type DroneSession, type SessionAction } from "./machine";

const run = (actions: SessionAction[], from: DroneSession = createSession("s1")) => actions.reduce(sessionReducer, from);

const toPreview: SessionAction[] = [
  { type: "START", sessionId: "s2" },
  { type: "CHOOSE_ANIMAL", animal: "shark" },
  { type: "CHOOSE_MOVEMENT", movement: "dive" },
  { type: "CHOOSE_POWER", power: "sonar" },
  { type: "CONFIRM_SUMMARY" },
  { type: "OPEN_CAMERA" },
  { type: "PHOTO_TAKEN", image: "data:image/jpeg;base64,AAAA" },
];

describe("sessionReducer", () => {
  it("parcourt le chemin nominal et conserve les choix", () => {
    const s = run(toPreview);
    expect(s.status).toBe("preview");
    expect(s).toMatchObject({ animal: "shark", movement: "dive", power: "sonar", sessionId: "s2" });
  });

  it("ignore un double clic sur une carte (le 2e choix arrive sur l'écran suivant)", () => {
    const s = run([
      { type: "START", sessionId: "s2" },
      { type: "CHOOSE_ANIMAL", animal: "shark" },
      { type: "CHOOSE_ANIMAL", animal: "whale" },
    ]);
    expect(s.status).toBe("movement");
    expect(s.animal).toBe("shark");
  });

  it("permet de reprendre la photo", () => {
    const s = run([...toPreview, { type: "RETAKE" }]);
    expect(s.status).toBe("camera");
    expect(s.capturedImage).toBeUndefined();
  });

  it("ne lance qu'une génération malgré une double validation", () => {
    const s = run([...toPreview, { type: "CONFIRM_PHOTO", at: 1 }, { type: "CONFIRM_PHOTO", at: 2 }]);
    expect(s.status).toBe("generating");
    expect(s.generationAttempt).toBe(1);
    expect(s.captureConfirmedAt).toBe(1);
  });

  it("attend la fin de la scène avant d'afficher le résultat", () => {
    let s = run([...toPreview, { type: "CONFIRM_PHOTO", at: 1 }]);
    s = sessionReducer(s, { type: "SCENE_FINISHED" });
    expect(s.status).toBe("generating");
    s = sessionReducer(s, { type: "GENERATION_SUCCEEDED", attempt: 1, imageUrl: "/img" });
    expect(s.status).toBe("generating");
    expect(s.generationStatus).toBe("ready");
    s = sessionReducer(s, { type: "SCENE_FINISHED" });
    expect(s.status).toBe("result");
    expect(s.generatedImage).toBe("/img");
  });

  it("ignore les réponses d'une tentative obsolète", () => {
    let s = run([...toPreview, { type: "CONFIRM_PHOTO", at: 1 }]);
    s = sessionReducer(s, { type: "GENERATION_FAILED", attempt: 1, retryable: true });
    expect(s.status).toBe("error");
    s = sessionReducer(s, { type: "RETRY" });
    expect(s.generationAttempt).toBe(2);
    s = sessionReducer(s, { type: "GENERATION_SUCCEEDED", attempt: 1, imageUrl: "/old" });
    expect(s.generationStatus).toBe("pending");
    s = sessionReducer(s, { type: "GENERATION_SUCCEEDED", attempt: 2, imageUrl: "/new" });
    expect(s.generatedImage).toBe("/new");
  });

  it("conserve la photo et les choix lors d'un retry", () => {
    let s = run([...toPreview, { type: "CONFIRM_PHOTO", at: 1 }]);
    s = sessionReducer(s, { type: "GENERATION_FAILED", attempt: 1, retryable: true });
    s = sessionReducer(s, { type: "RETRY" });
    expect(s.status).toBe("generating");
    expect(s.capturedImage).toBe("data:image/jpeg;base64,AAAA");
    expect(s.animal).toBe("shark");
  });

  it("efface toute la session au reset", () => {
    let s = run([...toPreview, { type: "CONFIRM_PHOTO", at: 1 }]);
    s = sessionReducer(s, { type: "RESET", sessionId: "s3" });
    expect(s).toEqual(createSession("s3"));
  });

  it("gère le parcours e-mail et l'échec d'envoi sans perdre le résultat", () => {
    let s = run([...toPreview, { type: "CONFIRM_PHOTO", at: 1 }]);
    s = sessionReducer(s, { type: "GENERATION_CREATED", attempt: 1, generationId: "g1" });
    s = sessionReducer(s, { type: "GENERATION_SUCCEEDED", attempt: 1, imageUrl: "/img" });
    s = sessionReducer(s, { type: "SCENE_FINISHED" });
    s = sessionReducer(s, { type: "OPEN_EMAIL" });
    s = sessionReducer(s, { type: "EMAIL_SENDING" });
    s = sessionReducer(s, { type: "CLOSE_EMAIL" });
    expect(s.status).toBe("email"); // impossible de fermer pendant l'envoi
    s = sessionReducer(s, { type: "EMAIL_RESULT", ok: false });
    expect(s.email.status).toBe("failed");
    expect(s.generatedImage).toBe("/img");
    s = sessionReducer(s, { type: "EMAIL_SENDING" });
    s = sessionReducer(s, { type: "EMAIL_RESULT", ok: true });
    expect(s.status).toBe("complete");
  });

  it("n'accepte le lien de partage que pour la génération courante", () => {
    let s = run([...toPreview, { type: "CONFIRM_PHOTO", at: 1 }]);
    s = sessionReducer(s, { type: "GENERATION_CREATED", attempt: 1, generationId: "g1" });
    s = sessionReducer(s, { type: "SHARE_DONE", generationId: "other", url: "https://x" });
    expect(s.share.status).toBe("idle");
    s = sessionReducer(s, { type: "SHARE_DONE", generationId: "g1", url: "https://x" });
    expect(s.share).toEqual({ status: "ready", url: "https://x" });
  });

  it("revient d'une étape avec BACK", () => {
    const s = run([...toPreview, { type: "BACK" }]);
    expect(s.status).toBe("camera");
    expect(run([{ type: "START", sessionId: "x" }, { type: "BACK" }]).status).toBe("welcome");
  });
});
