"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { fill, texts } from "@/config/texts";
import type { PublicConfig } from "@/lib/publicConfig";
import type { DroneSession } from "@/lib/session/machine";
import { droneTagline } from "@/lib/client/useShareController";
import { PrimaryButton } from "./PrimaryButton";
import { QrCode } from "./QrCode";

interface Props {
  session: DroneSession;
  config: PublicConfig;
  onAgain: () => void;
  onEmail: () => void;
}

const CONFETTI_COLORS = ["#ffffff", "#EF002F", "#5FD4FF", "#9DB8F2", "#ffffff", "#EF002F"];

/**
 * Révélation + écran résultat : l'image du drone est le héros de l'écran.
 * Le titre « MON SUPER DRONE » est ajouté par l'application (jamais par l'IA).
 */
export function DroneReveal({ session, config, onAgain, onEmail }: Props) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 2200);
    return () => window.clearTimeout(t);
  }, []);

  const tagline = config.showSubtitle ? droneTagline(session) : "";
  const { share } = session;

  return (
    <section className={`reveal${settled ? " is-settled" : ""}`}>
      <div className="reveal-flash" aria-hidden />
      <div className="confetti" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            style={
              {
                left: `${(i * 29) % 100}%`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 9) * 0.12}s`,
                animationDuration: `${2.4 + (i % 5) * 0.35}s`,
                "--rot": `${(i * 47) % 360}deg`,
              } as CSSProperties
            }
            className={i % 3 === 0 ? "star" : undefined}
          />
        ))}
      </div>

      <div className="reveal-main">
        <h1 className="reveal-title">{texts.result.title}</h1>
        <span className="title-rule" aria-hidden />
        <figure className="reveal-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={session.generatedImage} alt="Ton super drone" className="reveal-image" draggable={false} />
        </figure>
        {tagline && <p className="reveal-tagline">{tagline}</p>}
      </div>

      <aside className="reveal-side">
        {config.shareEnabled && share.status !== "unavailable" && (
          <div className="share-card">
            <p className="share-title">{texts.result.scan}</p>
            {share.status === "ready" && share.url ? (
              <>
                <QrCode value={share.url} />
                <p className="share-ttl">{fill(texts.result.linkValidity, { hours: config.shareTtlHours })}</p>
              </>
            ) : (
              <div className="qr-placeholder">
                <span>{texts.result.preparingQr}</span>
              </div>
            )}
          </div>
        )}
        <p className="photo-hint">{texts.result.photoFallback}</p>
        {config.emailEnabled && (
          <PrimaryButton variant="ghost" size="md" onPress={onEmail}>
            {texts.result.email}
          </PrimaryButton>
        )}
        <PrimaryButton onPress={onAgain} size="lg" className="again-btn">
          {texts.result.again}
        </PrimaryButton>
      </aside>
    </section>
  );
}
