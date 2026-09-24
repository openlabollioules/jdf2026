import { generationStore } from "@/lib/generation/store";
import { ID_RE } from "@/lib/server/ids";

export const dynamic = "force-dynamic";

/** Sert l'image générée (ou la composition finale avec ?variant=final). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = ID_RE.test(id) ? generationStore.get(id) : undefined;
  const variant = new URL(req.url).searchParams.get("variant");
  const img = variant === "final" ? (rec?.final ?? rec?.result) : rec?.result;
  if (!img) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": img.mime,
    "Content-Length": String(img.bytes.length),
    "Cache-Control": "private, max-age=3600",
  };
  if (img.mime === "image/svg+xml") headers["Content-Security-Policy"] = "default-src 'none'; img-src data:; style-src 'unsafe-inline'";
  if (new URL(req.url).searchParams.has("download")) headers["Content-Disposition"] = 'attachment; filename="mon-super-drone.jpg"';
  return new Response(new Uint8Array(img.bytes), { headers });
}
