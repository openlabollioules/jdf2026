import { describe, expect, it } from "vitest";
import { animals, cleanCustomPower, movements, parseChoices, powers } from "@/config/choices";
import { buildDronePrompt } from "./prompts";
import { MODEL_ADAPTERS, resolveModelAdapter } from "./models";
import { extractOutputUrl } from "./replicate";

describe("buildDronePrompt", () => {
  it("intègre les trois choix sous forme sémantique, pas technique", () => {
    const p = buildDronePrompt({ animal: "shark", movement: "fly", power: "lightning" });
    expect(p).toContain("streamlined hydrodynamic shapes of a shark");
    expect(p).toContain("aerial naval drone");
    expect(p).toContain("lightning arcs");
    expect(p).not.toMatch(/\{|\}|undefined/);
  });

  it("impose la fidélité au croquis et interdit le texte", () => {
    const p = buildDronePrompt({ animal: "turtle", movement: "sail", power: "shield" });
    expect(p).toMatch(/Preserve the overall silhouette/);
    expect(p).toMatch(/No text/);
    expect(p).not.toMatch(/MON SUPER DRONE/i);
  });

  it("désigne l'image par « image 1 » pour les modèles multi-images", () => {
    expect(buildDronePrompt({ animal: "dolphin", movement: "dive", power: "waves" }, "reference")).toContain("image 1");
  });

  it("produit un prompt pour toutes les combinaisons configurées", () => {
    for (const a of animals) for (const m of movements) for (const pw of powers) {
      const p = buildDronePrompt({ animal: a.id, movement: m.id, power: pw.id });
      expect(p).toContain(a.prompt);
      expect(p).toContain(pw.prompt);
    }
  });
});

describe("parseChoices", () => {
  it("valide strictement les valeurs", () => {
    expect(parseChoices({ animal: "shark", movement: "sail", power: "sonar" })).toEqual({ animal: "shark", movement: "sail", power: "sonar" });
    expect(parseChoices({ animal: "dragon", movement: "sail", power: "sonar" })).toBeNull();
    expect(parseChoices({ animal: "shark", movement: "sail" })).toBeNull();
    expect(parseChoices({ animal: "__proto__", movement: "sail", power: "sonar" })).toBeNull();
  });

  it("accepte une idée libre à chaque étape et refuse les textes invalides", () => {
    const c = parseChoices({
      animal: "custom", customAnimal: "  pieuvre   lumineuse ",
      movement: "custom", customMovement: " sous la banquise ",
      power: "custom", customPower: " bulles géantes ",
    });
    expect(c).toEqual({
      animal: "custom", customAnimal: "pieuvre lumineuse",
      movement: "custom", customMovement: "sous la banquise",
      power: "custom", customPower: "bulles géantes",
    });
    expect(buildDronePrompt(c!)).toContain('"pieuvre lumineuse"');
    expect(parseChoices({ animal: "custom", movement: "sail", power: "sonar" })).toBeNull();
    expect(parseChoices({ animal: "shark", movement: "custom", customMovement: "tuer les poissons", power: "sonar" })).toBeNull();
  });
});

describe("pouvoir inventé (champ libre)", () => {
  it("accepte un texte d'enfant, le nettoie et l'intègre au prompt entre guillemets", () => {
    const c = parseChoices({ animal: "whale", movement: "dive", power: "custom", customPower: "  faire des   bulles géantes ! " });
    expect(c).toEqual({ animal: "whale", movement: "dive", power: "custom", customPower: "faire des bulles géantes !" });
    const p = buildDronePrompt(c!);
    expect(p).toContain('"faire des bulles géantes !"');
    expect(p).toMatch(/child-safe/);
  });

  it("refuse un pouvoir vide, trop long, avec des symboles ou grossier", () => {
    expect(parseChoices({ animal: "whale", movement: "dive", power: "custom" })).toBeNull();
    expect(cleanCustomPower("ab")).toEqual({ ok: false, reason: "length" });
    expect(cleanCustomPower("x".repeat(61))).toEqual({ ok: false, reason: "length" });
    expect(cleanCustomPower("<script>alert(1)</script>")).toEqual({ ok: false, reason: "chars" });
    expect(cleanCustomPower("dire des gros MERDE")).toEqual({ ok: false, reason: "blocked" });
    expect(cleanCustomPower("tuer les méchants")).toEqual({ ok: false, reason: "blocked" });
  });

  it("n'a pas de faux positif sur un mot contenant un mot interdit", () => {
    expect(cleanCustomPower("contrôler la météo").ok).toBe(true);
    expect(cleanCustomPower("culbuter les vagues").ok).toBe(true);
  });

  it("a des identifiants uniques dans chaque liste", () => {
    for (const list of [animals, movements, powers]) {
      expect(new Set(list.map((o) => o.id)).size).toBe(list.length);
    }
  });
});

describe("model adapters", () => {
  const generic = { imageField: "image", imageFieldIsArray: false };

  it("place l'image dans le bon champ selon le modèle", () => {
    const args = { prompt: "p", imageUri: "data:x", aspectRatio: "match_input_image" };
    expect(resolveModelAdapter("prunaai/p-image-edit", generic).buildInput(args)).toMatchObject({ images: ["data:x"] });
    expect(resolveModelAdapter("black-forest-labs/flux-kontext-pro", generic).buildInput(args)).toMatchObject({ input_image: "data:x" });
    expect(resolveModelAdapter("google/nano-banana-2-lite", generic).buildInput(args)).toMatchObject({ image_input: ["data:x"] });
    expect(resolveModelAdapter("google/nano-banana", generic).buildInput(args)).toMatchObject({ image_input: ["data:x"] });
  });

  it("accepte une version figée et un modèle inconnu (adaptateur générique)", () => {
    expect(resolveModelAdapter("prunaai/p-image-edit:abcdef0123456789", generic).id).toBe("prunaai/p-image-edit");
    const custom = resolveModelAdapter("someone/new-model", { imageField: "img", imageFieldIsArray: true });
    expect(custom.buildInput({ prompt: "p", imageUri: "u", aspectRatio: "1:1" })).toMatchObject({ img: ["u"] });
    expect(MODEL_ADAPTERS.length).toBeGreaterThan(1);
  });

  it("extrait l'URL de sortie quel que soit le format", () => {
    expect(extractOutputUrl("https://a")).toBe("https://a");
    expect(extractOutputUrl(["https://b"])).toBe("https://b");
    expect(extractOutputUrl(null)).toBeNull();
  });
});
