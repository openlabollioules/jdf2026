import { afterAll, describe, expect, it } from "vitest";
import { mkdtemp, rm, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { shareKey } from "./keys";
import { cleanupLocalFiles, readLocalFile, writeLocalFile } from "./local";
import { presignR2Get, r2ObjectUrl } from "./r2";

const R2 = {
  accountId: "acc123",
  accessKeyId: "AKIDEXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
  bucket: "drones-jdf",
  publicUrl: "",
};

describe("clés de partage", () => {
  it("préfixe drones/, dossier journalier et nom non devinable", () => {
    expect(shareKey("jpg", new Date("2026-09-25T10:00:00Z"))).toMatch(/^drones\/2026-09-25\/[a-z0-9]{32}\.jpg$/);
  });
});

describe("R2", () => {
  it("construit l'URL S3 du compte", () => {
    expect(r2ObjectUrl(R2, "drones/a.jpg")).toBe("https://acc123.r2.cloudflarestorage.com/drones-jdf/drones/a.jpg");
  });
  it("pré-signe un GET, durée plafonnée à 7 jours", async () => {
    const url = new URL(await presignR2Get(R2, "drones/a.jpg", 24 * 30));
    expect(url.host).toBe("acc123.r2.cloudflarestorage.com");
    expect(url.searchParams.get("X-Amz-Expires")).toBe(String(7 * 24 * 3600));
    expect(url.searchParams.get("X-Amz-Credential")).toMatch(/^AKIDEXAMPLE\/\d{8}\/auto\/s3\/aws4_request$/);
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("stockage local", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "drone-storage-"));
  afterAll(() => rm(dir, { recursive: true, force: true }));

  it("écrit puis relit un fichier", async () => {
    const name = await writeLocalFile(dir, Buffer.from("img"), "jpg");
    expect((await readLocalFile(dir, name, 48))?.toString()).toBe("img");
  });
  it("refuse les noms suspects", async () => {
    expect(await readLocalFile(dir, "../../etc/passwd", 48)).toBeNull();
  });
  it("oublie et supprime les fichiers expirés", async () => {
    const name = await writeLocalFile(dir, Buffer.from("old"), "png");
    const old = new Date(Date.now() - 49 * 3600_000);
    await utimes(path.join(dir, name), old, old);
    await cleanupLocalFiles(dir, 48);
    expect(await readLocalFile(dir, name, 48)).toBeNull();
  });
});
