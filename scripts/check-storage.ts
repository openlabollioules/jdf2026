/**
 * Vérifie la configuration du stockage (QR code) sans passer par la borne.
 *
 *   npm run check:storage
 *
 * Dépose une petite image de test avec STORAGE_PROVIDER, puis la télécharge
 * via l'URL qui serait encodée dans le QR code.
 */
import { uploadShareImage } from "@/lib/storage";
import { getServerConfig } from "@/lib/server/env";

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* fichier absent */
  }
}

// PNG 1×1 transparent.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  const cfg = getServerConfig().storage;
  console.log(`Fournisseur : ${cfg.provider} · durée : ${cfg.ttlHours} h`);
  if (cfg.provider === "r2") {
    console.log(`Bucket R2   : ${cfg.r2.bucket || "(vide)"} · accès : ${cfg.r2.publicUrl ? `public (${cfg.r2.publicUrl})` : "privé, URL pré-signée"}`);
  }

  const share = await uploadShareImage(PNG, "image/png", "http://localhost:3000");
  if (!share) {
    console.log("✗ Aucun lien possible avec cette configuration (STORAGE_PROVIDER=none, ou « local » sans PUBLIC_BASE_URL).");
    process.exit(1);
  }
  console.log(`✓ Upload OK\n  ${share.url}`);

  const res = await fetch(share.url);
  const type = res.headers.get("content-type");
  if (!res.ok) {
    console.log(`✗ Téléchargement refusé : HTTP ${res.status}`);
    if (cfg.provider === "r2" && cfg.r2.publicUrl) console.log("  → Vérifier que l'accès public (r2.dev ou domaine) est activé sur le bucket.");
    process.exit(1);
  }
  console.log(`✓ Téléchargement OK (${type}) — le QR code fonctionnera.`);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
