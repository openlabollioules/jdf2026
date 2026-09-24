import "server-only";
import { branding } from "@/config/branding";
import type { PublicConfig } from "@/lib/publicConfig";

/**
 * Configuration serveur lue depuis les variables d'environnement.
 * Aucune valeur secrète ne doit sortir de ce module vers le client :
 * seul `getPublicConfig()` produit ce qui est transmis au navigateur.
 */

function str(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v.trim() === "" ? fallback : v.trim();
}

function int(name: string, fallback: number, min = -Infinity, max = Infinity): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw);
}

export function getServerConfig() {
  const replicateToken = str("REPLICATE_API_TOKEN");
  const providerRaw = str("GENERATION_PROVIDER", replicateToken ? "replicate" : "mock");
  const provider = providerRaw === "replicate" ? "replicate" : "mock";

  return {
    devTools: bool("DEV_TOOLS", process.env.NODE_ENV !== "production"),
    generation: {
      provider: provider as "replicate" | "mock",
      /** Délai simulé du mode mock (ms). */
      mockDelayMs: int("MOCK_DELAY_MS", 5000, 0, 120_000),
      timeoutMs: int("GENERATION_TIMEOUT_MS", 60_000, 10_000, 300_000),
      /** Nombre de nouvelles tentatives automatiques côté serveur en cas d'échec transitoire. */
      maxRetries: int("REPLICATE_MAX_RETRIES", 1, 0, 3),
      pollIntervalMs: int("REPLICATE_POLL_INTERVAL_MS", 500, 200, 5000),
    },
    replicate: {
      token: replicateToken,
      model: str("REPLICATE_MODEL", "prunaai/p-image-edit"),
      aspectRatio: str("REPLICATE_ASPECT_RATIO", "match_input_image"),
      /** JSON optionnel fusionné dans l'input envoyé au modèle (réglages avancés). */
      extraInput: str("REPLICATE_EXTRA_INPUT"),
      /** Pour un modèle non préconfiguré : nom du champ image et format tableau ou non. */
      imageField: str("REPLICATE_IMAGE_FIELD", "input_image"),
      imageFieldIsArray: bool("REPLICATE_IMAGE_FIELD_IS_ARRAY", false),
    },
    storage: {
      provider: str("STORAGE_PROVIDER", "local") as "local" | "r2" | "supabase" | "vercel-blob" | "none",
      ttlHours: int("SHARE_TTL_HOURS", 48, 1, 24 * 30),
      publicBaseUrl: str("PUBLIC_BASE_URL").replace(/\/+$/, ""),
      localDir: str("LOCAL_STORAGE_DIR", "./storage"),
      r2: {
        accountId: str("R2_ACCOUNT_ID"),
        accessKeyId: str("R2_ACCESS_KEY_ID"),
        secretAccessKey: str("R2_SECRET_ACCESS_KEY"),
        bucket: str("R2_BUCKET"),
        publicUrl: str("R2_PUBLIC_URL").replace(/\/+$/, ""),
      },
      supabase: {
        url: str("SUPABASE_URL").replace(/\/+$/, ""),
        serviceKey: str("SUPABASE_SERVICE_ROLE_KEY"),
        bucket: str("SUPABASE_BUCKET", "drones"),
      },
      vercelBlob: {
        token: str("BLOB_READ_WRITE_TOKEN"),
      },
    },
    email: {
      provider: str("EMAIL_PROVIDER", "none") as "none" | "log" | "resend" | "sendgrid" | "smtp",
      from: str("EMAIL_FROM", "Drone du futur <drone@example.com>"),
      resendApiKey: str("RESEND_API_KEY"),
      sendgridApiKey: str("SENDGRID_API_KEY"),
      smtpUrl: str("SMTP_URL"),
    },
    limits: {
      maxUploadBytes: int("MAX_UPLOAD_BYTES", 4 * 1024 * 1024, 100_000, 20 * 1024 * 1024),
      generatePerMinute: int("RATE_LIMIT_GENERATE_PER_MINUTE", 12, 1, 1000),
      emailPerMinute: int("RATE_LIMIT_EMAIL_PER_MINUTE", 6, 1, 1000),
    },
    /** Durée de conservation en mémoire des croquis/résultats (minimisation des données). */
    retentionMinutes: int("SESSION_RETENTION_MINUTES", 60, 5, 24 * 60),
    ui: {
      sceneMinMs: int("SCENE_MIN_DURATION_MS", 6500, 0, 60_000),
      resultIdleMs: int("RESULT_IDLE_TIMEOUT_MS", 120_000, 10_000, 3_600_000),
      questionIdleMs: int("QUESTION_IDLE_TIMEOUT_MS", 300_000, 30_000, 3_600_000),
      cameraMirror: bool("CAMERA_MIRROR", false),
      cameraRotation: int("CAMERA_ROTATION", 0, 0, 270),
      cameraCountdown: int("CAMERA_COUNTDOWN", 3, 0, 10),
      cameraDeviceLabel: str("CAMERA_DEVICE_LABEL"),
      captureMaxSize: int("CAPTURE_MAX_SIZE", 1024, 512, 2048),
      captureAspect: str("CAPTURE_ASPECT", "4:3"),
      showSubtitle: bool("RESULT_SHOW_SUBTITLE", true),
      eventName: str("EVENT_NAME", branding.eventName),
    },
  };
}

export type ServerConfig = ReturnType<typeof getServerConfig>;

function parseAspect(value: string): number {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(value);
  if (!m) return 4 / 3;
  const r = Number(m[1]) / Number(m[2]);
  return r > 0.2 && r < 5 ? r : 4 / 3;
}

export function getPublicConfig(): PublicConfig {
  const c = getServerConfig();
  return {
    devTools: c.devTools,
    sceneMinMs: c.ui.sceneMinMs,
    generationTimeoutMs: c.generation.timeoutMs,
    resultIdleMs: c.ui.resultIdleMs,
    questionIdleMs: c.ui.questionIdleMs,
    emailEnabled: c.email.provider !== "none",
    shareEnabled: c.storage.provider !== "none",
    shareTtlHours: c.storage.ttlHours,
    camera: {
      mirror: c.ui.cameraMirror,
      rotation: ([0, 90, 180, 270].includes(c.ui.cameraRotation) ? c.ui.cameraRotation : 0) as 0 | 90 | 180 | 270,
      countdown: c.ui.cameraCountdown,
      deviceLabel: c.ui.cameraDeviceLabel,
      maxSize: c.ui.captureMaxSize,
      aspect: parseAspect(c.ui.captureAspect),
    },
    showSubtitle: c.ui.showSubtitle,
    eventName: c.ui.eventName,
    mockMode: c.generation.provider === "mock",
  };
}
