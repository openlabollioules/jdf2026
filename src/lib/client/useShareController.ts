"use client";

import { useEffect, type Dispatch } from "react";
import { describeChoices } from "@/config/choices";
import { texts } from "@/config/texts";
import { branding } from "@/config/branding";
import type { PublicConfig } from "@/lib/publicConfig";
import { sessionChoices, type DroneSession, type SessionAction } from "@/lib/session/machine";
import { shareGeneration } from "./api";
import { composeFinalImage } from "./compose";

export function droneTagline(s: Pick<DroneSession, "animal" | "customAnimal" | "movement" | "customMovement" | "power" | "customPower">): string {
  const choices = sessionChoices(s);
  if (!choices) return "";
  const d = describeChoices(choices);
  return [d.animal.tagline, d.movement.tagline, d.power.tagline].join(" • ");
}

/**
 * Dès que le résultat est affiché : compose l'image finale (cadre + titre),
 * l'envoie au backend qui la dépose sur le stockage cloud et renvoie l'URL du QR code.
 */
export function useShareController(state: DroneSession, dispatch: Dispatch<SessionAction>, config: PublicConfig) {
  const { status, generationId, generatedImage, share } = state;
  const active = status === "result" || status === "email" || status === "complete";
  const needed = config.shareEnabled || config.emailEnabled;

  useEffect(() => {
    if (!active || !needed || !generationId || !generatedImage || share.status !== "idle") return;
    dispatch({ type: "SHARE_PENDING", generationId });
    const abort = new AbortController();
    const tagline = droneTagline(state);

    (async () => {
      let composed: string | null = null;
      try {
        composed = await composeFinalImage({
          imageUrl: generatedImage,
          title: texts.result.title,
          subtitle: tagline,
          brand: { logoSrc: branding.logo.src, eventName: config.eventName || branding.eventName },
        });
      } catch {
        composed = null; // l'image brute sera utilisée
      }
      for (let i = 0; i < 2; i++) {
        try {
          const r = await shareGeneration(generationId, composed, abort.signal);
          if (r.shareUrl || r.reason === "unavailable" || i === 1) {
            dispatch({ type: "SHARE_DONE", generationId, url: r.shareUrl });
            return;
          }
        } catch {
          if (abort.signal.aborted) return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      dispatch({ type: "SHARE_DONE", generationId, url: null });
    })();
    // La composition n'est pas annulée au changement d'écran résultat ↔ e-mail.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, needed, generationId, generatedImage, share.status]);
}
