import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Lit un corps JSON en refusant les requêtes plus lourdes que `maxBytes`. */
export async function readJsonBody<T = Record<string, unknown>>(req: Request, maxBytes: number): Promise<T | null> {
  const declared = Number(req.headers.get("content-length") || "0");
  if (declared > maxBytes) return null;
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
}

export function requestOrigin(req: Request): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}
