import { afterEach, describe, expect, it, vi } from "vitest";
import { rephraseCustomChoices } from "./rephrase";

const custom = {
  animal: "custom", customAnimal: "pieuvre lumineuse",
  movement: "sail", power: "shield",
} as const;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("rephraseCustomChoices", () => {
  it("ne sollicite pas OpenRouter sans idée libre ou sans clé", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await rephraseCustomChoices(custom, { apiKey: "", model: "test" })).toEqual({});
    expect(await rephraseCustomChoices({ animal: "shark", movement: "sail", power: "shield" }, { apiKey: "test", model: "test" })).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("garde l'idée validée quand OpenRouter échoue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status: 503 })));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(await rephraseCustomChoices(custom, { apiKey: "test", model: "test" })).toEqual({});
  });
});
