import { afterEach, describe, expect, it, vi } from "vitest";
import { createResendProvider } from "./providers";

afterEach(() => vi.restoreAllMocks());

describe("Resend", () => {
  it("envoie l'image finale en pièce jointe avec l'expéditeur configuré", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"id":"email-test"}', { status: 200 }));
    await createResendProvider("re_test").send({
      from: "Drone du futur <drone@domaine.test>",
      to: "parent@example.fr",
      subject: "Ton super drone",
      text: "Voici ton drone.",
      html: "<p>Voici ton drone.</p>",
      attachment: { filename: "mon-super-drone.jpg", mime: "image/jpeg", bytes: Buffer.from("image-test") },
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = fetch.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(options?.method).toBe("POST");
    expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer re_test");
    const payload = JSON.parse(String(options?.body));
    expect(payload.from).toBe("Drone du futur <drone@domaine.test>");
    expect(payload.to).toEqual(["parent@example.fr"]);
    expect(payload.attachments).toEqual([{ filename: "mon-super-drone.jpg", content: Buffer.from("image-test").toString("base64") }]);
  });
});
