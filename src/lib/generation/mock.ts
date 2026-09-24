import { describeChoices, type DroneChoices } from "@/config/choices";

/**
 * Générateur factice (mode test sans Replicate).
 * Produit un SVG coloré qui incruste le croquis (fusion « multiply » pour faire
 * disparaître le blanc du tableau) sur un décor dépendant des choix.
 */
export function generateMockDrone(input: DroneChoices & { sketchImage: { bytes: Buffer; mime: string } }): Buffer {
  const { power } = describeChoices(input);
  const sketch = `data:${input.sketchImage.mime};base64,${input.sketchImage.bytes.toString("base64")}`;
  const sky = input.movement === "dive" ? ["#2a8fd6", "#062a6b"] : input.movement === "sail" ? ["#cfeaff", "#1f6fc9"] : ["#dff2ff", "#6fb2ff"];
  const accent = power.color;

  const sparkles = Array.from({ length: 18 }, (_, i) => {
    const x = 80 + ((i * 197) % 1060);
    const y = 60 + ((i * 131) % 780);
    const s = 10 + ((i * 7) % 18);
    return `<path d="M${x} ${y - s} L${x + s / 4} ${y - s / 4} L${x + s} ${y} L${x + s / 4} ${y + s / 4} L${x} ${y + s} L${x - s / 4} ${y + s / 4} L${x - s} ${y} L${x - s / 4} ${y - s / 4} Z" fill="${i % 2 ? accent : "#ffffff"}" opacity="0.9"/>`;
  }).join("");

  const decor =
    input.movement === "dive"
      ? Array.from({ length: 14 }, (_, i) => `<circle cx="${60 + ((i * 89) % 1100)}" cy="${120 + ((i * 173) % 700)}" r="${6 + (i % 5) * 4}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>`).join("")
      : `<g fill="#ffffff" opacity="0.85"><ellipse cx="200" cy="160" rx="120" ry="40"/><ellipse cx="260" cy="135" rx="70" ry="45"/><ellipse cx="960" cy="720" rx="150" ry="45"/><ellipse cx="1030" cy="690" rx="80" ry="50"/></g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${accent}" stop-opacity="0.8"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  ${decor}
  <ellipse cx="600" cy="450" rx="520" ry="380" fill="url(#glow)"/>
  <image href="${sketch}" xlink:href="${sketch}" x="120" y="90" width="960" height="720" preserveAspectRatio="xMidYMid meet" style="mix-blend-mode:multiply"/>
  ${sparkles}
  <rect x="930" y="846" width="256" height="40" rx="20" fill="#000" opacity="0.35"/>
  <text x="1058" y="873" font-family="sans-serif" font-size="20" fill="#fff" text-anchor="middle">mode test</text>
</svg>`;
  return Buffer.from(svg, "utf8");
}
