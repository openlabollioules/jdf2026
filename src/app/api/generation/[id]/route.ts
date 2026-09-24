import { cancelGeneration } from "@/lib/generation/runner";
import { generationStore } from "@/lib/generation/store";
import { ID_RE } from "@/lib/server/ids";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const rec = ID_RE.test(id) ? generationStore.get(id) : undefined;
  if (!rec) return json({ status: "failed", retryable: true, reason: "not_found" }, 404);

  if (rec.status === "processing") return json({ status: "processing" });
  if (rec.status === "failed") return json({ status: "failed", retryable: rec.retryable });
  return json({ status: "succeeded", imageUrl: `/api/generation/${rec.id}/image` });
}

/** Annulation (reset de la borne pendant la génération). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (ID_RE.test(id)) cancelGeneration(id);
  return json({ ok: true });
}
