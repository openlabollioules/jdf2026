import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateDrone, GenerationError } from "./generateDrone";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const sketch = { bytes: JPEG, mime: "image/jpeg" };
const choices = { animal: "whale", movement: "dive", power: "shield" } as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("generateDrone (Replicate simulé)", () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.GENERATION_PROVIDER = "replicate";
    process.env.REPLICATE_API_TOKEN = "r8_test";
    process.env.REPLICATE_MODEL = "black-forest-labs/flux-kontext-pro";
    process.env.REPLICATE_MAX_RETRIES = "1";
    process.env.REPLICATE_POLL_INTERVAL_MS = "200";
  });

  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it("envoie le croquis et le prompt au bon modèle, réessaie après une erreur 500, puis télécharge l'image", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    let creates = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        if (url.endsWith("/models/black-forest-labs/flux-kontext-pro/predictions")) {
          creates++;
          if (creates === 1) return json({ detail: "boom" }, 500);
          return json({ id: "p1", status: "processing" }, 201);
        }
        if (url.endsWith("/predictions/p1")) return json({ id: "p1", status: "succeeded", output: "https://cdn.test/out.jpg" });
        if (url === "https://cdn.test/out.jpg") return new Response(JPEG, { headers: { "content-type": "image/jpeg" } });
        return new Response("?", { status: 404 });
      }),
    );

    const events: string[] = [];
    const res = await generateDrone({ ...choices, sketchImage: sketch, onEvent: (e) => events.push(e.type) });

    expect(res.mime).toBe("image/jpeg");
    expect(res.attempts).toBe(2);
    expect(res.model).toBe("black-forest-labs/flux-kontext-pro");
    expect(events).toContain("retry");

    const create = calls.find((c) => c.url.endsWith("/predictions") && c.init?.method === "POST")!;
    const body = JSON.parse(String(create.init!.body)) as { input: Record<string, string> };
    expect(body.input.input_image).toMatch(/^data:image\/jpeg;base64,/);
    expect(body.input.prompt).toContain("whale");
    expect((create.init!.headers as Record<string, string>).Authorization).toBe("Bearer r8_test");
  });

  it("n'insiste pas indéfiniment : échec signalé comme réessayable après les tentatives", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ detail: "down" }, 503)));
    await expect(generateDrone({ ...choices, sketchImage: sketch })).rejects.toMatchObject({ retryable: true });
    expect(vi.mocked(fetch).mock.calls.length).toBe(2); // 1 essai + 1 retry
  });

  it("ne réessaie pas une erreur non récupérable (requête invalide)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ detail: "bad input" }, 422)));
    await expect(generateDrone({ ...choices, sketchImage: sketch })).rejects.toBeInstanceOf(GenerationError);
    expect(vi.mocked(fetch).mock.calls.length).toBe(1);
  });

  it("mode simulation : délai puis échec contrôlé", async () => {
    const start = Date.now();
    await expect(generateDrone({ ...choices, sketchImage: sketch, simulate: { delayMs: 50, fail: true } })).rejects.toMatchObject({ retryable: true });
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });
});
