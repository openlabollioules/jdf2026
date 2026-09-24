import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({ ok: true, time: new Date().toISOString() });
}
