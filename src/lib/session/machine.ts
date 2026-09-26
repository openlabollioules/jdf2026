import { CUSTOM_CHOICE_ID, CUSTOM_POWER_ID, type Animal, type AnimalChoice, type DroneChoices, type Movement, type MovementChoice, type PowerChoice } from "@/config/choices";

/**
 * Machine d'état globale de la borne (§29, §43).
 *
 * Tout l'état critique d'une session vit ici, dans un reducer pur et testable.
 * Une action non autorisée dans l'état courant est ignorée : c'est ce qui protège
 * contre les doubles clics / doubles soumissions.
 *
 * WELCOME → ANIMAL → MOVEMENT → POWER → SUMMARY → DRAWING → CAMERA → PREVIEW
 *   → GENERATING (mini-scène) → RESULT → EMAIL (optionnel) → COMPLETE → RESET → WELCOME
 *                    ↘ ERROR (RÉESSAYER → GENERATING)
 */
export type SessionStatus =
  | "welcome"
  | "animal"
  | "movement"
  | "power"
  | "summary"
  | "drawing"
  | "camera"
  | "preview"
  | "generating"
  | "result"
  | "email"
  | "complete"
  | "error";

export interface DroneSession {
  status: SessionStatus;
  /** Change à chaque nouvelle session : sert aussi à invalider les tâches asynchrones. */
  sessionId: string;
  animal?: AnimalChoice;
  customAnimal?: string;
  movement?: MovementChoice;
  customMovement?: string;
  power?: PowerChoice;
  /** Pouvoir inventé par l'enfant (si power === "custom"). */
  customPower?: string;

  capturedImage?: string;
  captureConfirmedAt?: number;

  /** Incrémenté à chaque demande de génération (y compris les retries). */
  generationAttempt: number;
  generationId?: string;
  generationStatus: "idle" | "pending" | "ready" | "failed";
  generatedImage?: string;
  retryable: boolean;

  share: { status: "idle" | "pending" | "ready" | "unavailable"; url?: string };
  email: { status: "idle" | "sending" | "failed" | "sent" };
}

export type SessionAction =
  | { type: "START"; sessionId: string }
  | { type: "RESET"; sessionId: string }
  | { type: "BACK" }
  | { type: "CHOOSE_ANIMAL"; animal: AnimalChoice; customAnimal?: string }
  | { type: "CHOOSE_MOVEMENT"; movement: MovementChoice; customMovement?: string }
  | { type: "CHOOSE_POWER"; power: PowerChoice; customPower?: string }
  | { type: "CONFIRM_SUMMARY" }
  | { type: "OPEN_CAMERA" }
  | { type: "PHOTO_TAKEN"; image: string }
  | { type: "RETAKE" }
  | { type: "CONFIRM_PHOTO"; at: number }
  | { type: "GENERATION_CREATED"; attempt: number; generationId: string }
  | { type: "GENERATION_SUCCEEDED"; attempt: number; imageUrl: string }
  | { type: "GENERATION_FAILED"; attempt: number; retryable: boolean }
  | { type: "SCENE_FINISHED" }
  | { type: "RETRY" }
  | { type: "REGENERATE" }
  | { type: "SHARE_PENDING"; generationId: string }
  | { type: "SHARE_DONE"; generationId: string; url: string | null }
  | { type: "OPEN_EMAIL" }
  | { type: "CLOSE_EMAIL" }
  | { type: "EMAIL_SENDING" }
  | { type: "EMAIL_RESULT"; ok: boolean }
  | { type: "BACK_TO_RESULT" }
  | { type: "DEV_LOAD_SKETCH"; sessionId: string; image: string; animal: Animal; movement: Movement; power: PowerChoice; customPower?: string };

export function createSession(sessionId: string): DroneSession {
  return {
    status: "welcome",
    sessionId,
    generationAttempt: 0,
    generationStatus: "idle",
    retryable: true,
    share: { status: "idle" },
    email: { status: "idle" },
  };
}

/** Relance une génération en conservant la photo et les choix. */
function requestGeneration(s: DroneSession): DroneSession {
  return {
    ...s,
    status: "generating",
    generationAttempt: s.generationAttempt + 1,
    generationId: undefined,
    generationStatus: "pending",
    generatedImage: undefined,
    retryable: true,
    share: { status: "idle" },
    email: { status: "idle" },
  };
}

const BACK_TARGET: Partial<Record<SessionStatus, SessionStatus>> = {
  animal: "welcome",
  movement: "animal",
  power: "movement",
  summary: "power",
  drawing: "summary",
  camera: "drawing",
  preview: "camera",
  error: "preview",
  email: "result",
  complete: "result",
};

export function sessionReducer(s: DroneSession, a: SessionAction): DroneSession {
  switch (a.type) {
    case "START":
      return s.status === "welcome" ? { ...createSession(a.sessionId), status: "animal" } : s;

    case "RESET":
      return createSession(a.sessionId);

    case "BACK": {
      const target = BACK_TARGET[s.status];
      if (!target) return s;
      if (s.status === "preview") return { ...s, status: target, capturedImage: undefined };
      if (s.status === "error") return { ...s, status: target, generationStatus: "idle" };
      return { ...s, status: target };
    }

    case "CHOOSE_ANIMAL":
      if (s.status !== "animal" || a.animal === CUSTOM_CHOICE_ID && !a.customAnimal) return s;
      return { ...s, animal: a.animal, customAnimal: a.animal === CUSTOM_CHOICE_ID ? a.customAnimal : undefined, status: "movement" };

    case "CHOOSE_MOVEMENT":
      if (s.status !== "movement" || a.movement === CUSTOM_CHOICE_ID && !a.customMovement) return s;
      return { ...s, movement: a.movement, customMovement: a.movement === CUSTOM_CHOICE_ID ? a.customMovement : undefined, status: "power" };

    case "CHOOSE_POWER":
      if (s.status !== "power") return s;
      if (a.power === CUSTOM_POWER_ID && !a.customPower) return s;
      return { ...s, power: a.power, customPower: a.power === CUSTOM_POWER_ID ? a.customPower : undefined, status: "summary" };

    case "CONFIRM_SUMMARY":
      return s.status === "summary" && s.animal && s.movement && s.power ? { ...s, status: "drawing" } : s;

    case "OPEN_CAMERA":
      return s.status === "drawing" ? { ...s, status: "camera" } : s;

    case "PHOTO_TAKEN":
      return s.status === "camera" ? { ...s, capturedImage: a.image, status: "preview" } : s;

    case "RETAKE":
      return s.status === "preview" ? { ...s, capturedImage: undefined, status: "camera" } : s;

    case "CONFIRM_PHOTO":
      return s.status === "preview" && s.capturedImage && s.animal && s.movement && s.power
        ? requestGeneration({ ...s, captureConfirmedAt: a.at })
        : s;

    case "GENERATION_CREATED":
      return a.attempt === s.generationAttempt && s.generationStatus === "pending" ? { ...s, generationId: a.generationId } : s;

    case "GENERATION_SUCCEEDED":
      return a.attempt === s.generationAttempt && s.status === "generating" && s.generationStatus === "pending"
        ? { ...s, generationStatus: "ready", generatedImage: a.imageUrl }
        : s;

    case "GENERATION_FAILED":
      return a.attempt === s.generationAttempt && s.status === "generating" && s.generationStatus === "pending"
        ? { ...s, generationStatus: "failed", retryable: a.retryable, status: "error" }
        : s;

    case "SCENE_FINISHED":
      return s.status === "generating" && s.generationStatus === "ready" ? { ...s, status: "result" } : s;

    case "RETRY":
      return s.status === "error" && s.capturedImage ? requestGeneration(s) : s;

    case "REGENERATE":
      return (s.status === "result" || s.status === "complete") && s.capturedImage ? requestGeneration(s) : s;

    case "SHARE_PENDING":
      return a.generationId === s.generationId && s.share.status === "idle" ? { ...s, share: { status: "pending" } } : s;

    case "SHARE_DONE":
      return a.generationId === s.generationId
        ? { ...s, share: a.url ? { status: "ready", url: a.url } : { status: "unavailable" } }
        : s;

    case "OPEN_EMAIL":
      return s.status === "result" ? { ...s, status: "email", email: { status: "idle" } } : s;

    case "CLOSE_EMAIL":
      return s.status === "email" && s.email.status !== "sending" ? { ...s, status: "result" } : s;

    case "EMAIL_SENDING":
      return s.status === "email" && s.email.status !== "sending" ? { ...s, email: { status: "sending" } } : s;

    case "EMAIL_RESULT":
      if (s.status !== "email" || s.email.status !== "sending") return s;
      return a.ok ? { ...s, status: "complete", email: { status: "sent" } } : { ...s, email: { status: "failed" } };

    case "BACK_TO_RESULT":
      return s.status === "complete" ? { ...s, status: "result" } : s;

    case "DEV_LOAD_SKETCH":
      return {
        ...createSession(a.sessionId),
        animal: a.animal,
        movement: a.movement,
        power: a.power,
        customPower: a.customPower,
        capturedImage: a.image,
        status: "preview",
      };

    default:
      return s;
  }
}

/** Écrans qui comptent dans l'indicateur de progression. */
export const PROGRESS_STEPS: SessionStatus[] = ["animal", "movement", "power", "summary", "drawing", "camera"];

export function progressIndex(status: SessionStatus): number {
  if (status === "preview") return PROGRESS_STEPS.indexOf("camera");
  return PROGRESS_STEPS.indexOf(status);
}

/** Les choix complets de la session, ou null s'il en manque. */
export function sessionChoices(s: Pick<DroneSession, "animal" | "customAnimal" | "movement" | "customMovement" | "power" | "customPower">): DroneChoices | null {
  if (!s.animal || !s.movement || !s.power) return null;
  if (s.animal === CUSTOM_CHOICE_ID && !s.customAnimal) return null;
  if (s.movement === CUSTOM_CHOICE_ID && !s.customMovement) return null;
  if (s.power === CUSTOM_POWER_ID && !s.customPower) return null;
  return {
    animal: s.animal, customAnimal: s.animal === CUSTOM_CHOICE_ID ? s.customAnimal : undefined,
    movement: s.movement, customMovement: s.movement === CUSTOM_CHOICE_ID ? s.customMovement : undefined,
    power: s.power, customPower: s.power === CUSTOM_POWER_ID ? s.customPower : undefined,
  };
}
