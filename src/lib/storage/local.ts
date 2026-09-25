import "server-only";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomId } from "@/lib/server/ids";

/** Nom de fichier accepté par /api/files/:name (empêche toute traversée de répertoire). */
export const LOCAL_NAME_RE = /^[a-z0-9]{24,64}\.(jpg|png|webp|svg)$/;

export async function writeLocalFile(dir: string, bytes: Buffer, ext: string): Promise<string> {
  const name = `${randomId(32)}.${ext}`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, name), bytes, { mode: 0o600 });
  return name;
}

/** Renvoie le fichier s'il existe et n'a pas expiré, sinon `null`. */
export async function readLocalFile(dir: string, name: string, ttlHours: number): Promise<Buffer | null> {
  if (!LOCAL_NAME_RE.test(name)) return null;
  const file = path.join(/*turbopackIgnore: true*/ dir, name);
  try {
    const info = await stat(file);
    if (info.mtimeMs + ttlHours * 3600_000 <= Date.now()) {
      await unlink(file).catch(() => {});
      return null;
    }
    return await readFile(file);
  } catch {
    return null;
  }
}

export async function cleanupLocalFiles(dir: string, ttlHours: number): Promise<void> {
  const limit = Date.now() - ttlHours * 3600_000;
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return;
  }
  for (const name of names) {
    if (!LOCAL_NAME_RE.test(name)) continue;
    const file = path.join(/*turbopackIgnore: true*/ dir, name);
    const info = await stat(file).catch(() => null);
    if (info && info.mtimeMs <= limit) await unlink(file).catch(() => {});
  }
}
