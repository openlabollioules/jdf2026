import { getServerConfig } from "@/lib/server/env";
import { readLocalFile } from "@/lib/storage/local";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", svg: "image/svg+xml" };

/** Téléchargement des images du fournisseur de stockage « local » (lien du QR code). */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const cfg = getServerConfig();
  if (cfg.storage.provider !== "local") return new Response("Not found", { status: 404 });
  const bytes = await readLocalFile(cfg.storage.localDir, name, cfg.storage.ttlHours);
  if (!bytes) return new Response("Ce lien a expiré.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const ext = name.split(".").pop()!;
  const headers: Record<string, string> = {
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `inline; filename="mon-super-drone.${ext}"`,
  };
  if (ext === "svg") headers["Content-Security-Policy"] = "default-src 'none'; img-src data:; style-src 'unsafe-inline'";
  return new Response(new Uint8Array(bytes), { headers });
}
