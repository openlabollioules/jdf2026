import { describe, expect, it } from "vitest";
import { decodeImageDataUrl, ImageValidationError } from "./image";
import { RateLimiter } from "./rateLimit";
import { percentile } from "./metrics";
import { randomId, ID_RE } from "./ids";
import { isValidEmail } from "@/lib/email";
import { getServerConfig, isEmailConfigured } from "./env";
import { fitAspect, outputSize, rotatedSize } from "@/lib/client/geometry";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("decodeImageDataUrl", () => {
  it("accepte un JPEG valide", () => {
    const img = decodeImageDataUrl(`data:image/jpeg;base64,${JPEG.toString("base64")}`, 1000);
    expect(img.mime).toBe("image/jpeg");
  });
  it("refuse un type déclaré qui ne correspond pas au contenu", () => {
    expect(() => decodeImageDataUrl(`data:image/jpeg;base64,${PNG.toString("base64")}`, 1000)).toThrow(ImageValidationError);
  });
  it("refuse le SVG, le texte et les images trop lourdes", () => {
    expect(() => decodeImageDataUrl("data:image/svg+xml;base64,PHN2Zz4=", 1000)).toThrow();
    expect(() => decodeImageDataUrl("hello", 1000)).toThrow();
    expect(() => decodeImageDataUrl(`data:image/jpeg;base64,${Buffer.alloc(3000, 0xff).toString("base64")}`, 1000)).toThrow(/lourde/);
  });
});

describe("RateLimiter", () => {
  it("bloque au-delà de la limite puis libère après la fenêtre", () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.check("a", 0)).toBe(true);
    expect(rl.check("a", 10)).toBe(true);
    expect(rl.check("a", 20)).toBe(false);
    expect(rl.check("b", 20)).toBe(true);
    expect(rl.check("a", 1500)).toBe(true);
  });
});

describe("utilitaires", () => {
  it("calcule médiane et P95", () => {
    const v = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(v, 50)).toBe(50);
    expect(percentile(v, 95)).toBe(95);
    expect(percentile([], 50)).toBeNull();
  });
  it("génère des identifiants longs et non devinables", () => {
    const a = randomId();
    expect(a).toMatch(ID_RE);
    expect(a).not.toBe(randomId());
  });
  it("valide les adresses e-mail", () => {
    expect(isValidEmail("parent@example.fr")).toBe(true);
    expect(isValidEmail("  parent.nom+drone@mail.co.uk ")).toBe(true);
    for (const bad of ["", "parent", "a@b", "a b@c.fr", "a@@b.fr", "a..b@c.fr", "<script>@x.fr", 42]) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
  it("n'active Resend qu'avec une clé et un expéditeur configuré", () => {
    const email = getServerConfig().email;
    expect(isEmailConfigured({ ...email, provider: "resend", resendApiKey: "" })).toBe(false);
    expect(isEmailConfigured({ ...email, provider: "resend", resendApiKey: "re_test", from: "Drone <drone@example.com>" })).toBe(false);
    expect(isEmailConfigured({ ...email, provider: "resend", resendApiKey: "re_test", from: "Drone <drone@domaine.fr>" })).toBe(true);
  });
});

describe("géométrie de capture", () => {
  it("centre un cadre 4:3 dans un flux 16:9", () => {
    const r = fitAspect(4 / 3, { w: 1920, h: 1080 });
    expect(r).toEqual({ x: 240, y: 0, w: 1440, h: 1080 });
  });
  it("gère la rotation et la réduction de taille", () => {
    expect(rotatedSize({ w: 1920, h: 1080 }, 90)).toEqual({ w: 1080, h: 1920 });
    expect(outputSize({ w: 1440, h: 1080 }, 1024)).toEqual({ w: 1024, h: 768 });
    expect(outputSize({ w: 400, h: 300 }, 1024)).toEqual({ w: 400, h: 300 });
  });
});
