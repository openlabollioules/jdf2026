import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // sans caractères ambigus

/** Identifiant aléatoire long et non devinable (≈ 5 bits d'entropie par caractère). */
export function randomId(length = 24): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export const ID_RE = /^[a-z0-9]{12,64}$/;
