"use client";

import { encodeWithinBudget } from "./capture";

/**
 * Composition finale exportable (§24) : illustration générée, titre ajouté par
 * l'application (jamais par l'IA), caractéristiques choisies et bandeau de marque
 * (logo + nom de l'événement). Réalisée dans le navigateur pour profiter des polices de l'interface.
 */
export interface ComposeOptions {
  imageUrl: string;
  title: string;
  subtitle?: string;
  brand?: { logoSrc: string; eventName: string };
}

const FONT = '"Montserrat Variable", "Montserrat", "Segoe UI", Arial, sans-serif';

function stripEmoji(s: string) {
  return s.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s{2,}/g, " ").trim();
}

async function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

export async function composeFinalImage(opts: ComposeOptions): Promise<string> {
  try {
    await Promise.all([document.fonts.load(`800 80px ${FONT}`), document.fonts.load(`600 40px ${FONT}`)]);
  } catch {
    /* police de secours */
  }
  const img = await loadImage(opts.imageUrl);
  const logo = opts.brand ? await loadImage(opts.brand.logoSrc).catch(() => null) : null;

  const W = 1600;
  const pad = 64;
  const headerH = 200;
  const subtitleH = opts.subtitle ? 100 : 30;
  const brandH = opts.brand ? 150 : 0;
  const innerW = W - pad * 2;
  const ratio = (img.naturalHeight || 3) / (img.naturalWidth || 4);
  const imgH = Math.round(innerW * ratio);
  const H = headerH + imgH + subtitleH + brandH + 20;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fond « grands fonds » + grille de plan technique.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0d3a9e");
  bg.addColorStop(0.55, "#061a4a");
  bg.addColorStop(1, "#030e2b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 56) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }

  // Titre + filet rouge.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 96px ${FONT}`;
  ctx.fillText(opts.title.toUpperCase(), W / 2, headerH / 2 - 8);
  ctx.fillStyle = "#EF002F";
  ctx.fillRect(W / 2 - 60, headerH / 2 + 56, 120, 8);

  // Illustration encadrée.
  const y = headerH;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(pad - 10, y - 10, innerW + 20, imgH + 20, 30);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pad, y, innerW, imgH, 22);
  ctx.clip();
  ctx.drawImage(img, pad, y, innerW, imgH);
  ctx.restore();

  // Caractéristiques.
  if (opts.subtitle) {
    ctx.font = `600 40px ${FONT}`;
    ctx.fillStyle = "#dbe6ff";
    ctx.fillText(stripEmoji(opts.subtitle), W / 2, y + imgH + 20 + subtitleH / 2);
  }

  // Bandeau de marque : logo | nom de l'événement.
  if (opts.brand) {
    const by = H - brandH;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, by, W, brandH);
    ctx.fillStyle = "#EF002F";
    ctx.fillRect(0, by, W, 6);
    const logoH = 76;
    const logoW = logo ? (logo.naturalWidth / logo.naturalHeight) * logoH : 0;
    ctx.font = `700 40px ${FONT}`;
    const label = stripEmoji(opts.brand.eventName).toUpperCase();
    const letter = 4;
    const textW = ctx.measureText(label).width + letter * label.length;
    const gap = 48;
    const total = logoW + (logo ? gap * 2 + 3 : 0) + textW;
    let x = (W - total) / 2;
    const cy = by + 6 + (brandH - 6) / 2;
    if (logo) {
      ctx.drawImage(logo, x, cy - logoH / 2, logoW, logoH);
      x += logoW + gap;
      ctx.fillStyle = "#c9d6ec";
      ctx.fillRect(x, cy - 40, 3, 80);
      x += 3 + gap;
    }
    ctx.fillStyle = "#002A8F";
    ctx.textAlign = "left";
    for (const ch of label) {
      ctx.fillText(ch, x, cy + 2);
      x += ctx.measureText(ch).width + letter;
    }
  }

  return encodeWithinBudget(canvas, 3 * 1024 * 1024);
}
