"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR code généré localement dans le navigateur (aucun service externe). */
export function QrCode({ value, size = 260 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#1d2b53", light: "#ffffff" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(null));
    return () => {
      alive = false;
    };
  }, [value]);
  if (!svg) return <div className="qr-placeholder" style={{ width: size, height: size }} />;
  // Le SVG provient de la librairie qrcode (contenu maîtrisé, pas d'entrée utilisateur brute).
  return <div className="qr" style={{ width: size, height: size }} role="img" aria-label="QR code de téléchargement" dangerouslySetInnerHTML={{ __html: svg }} />;
}
