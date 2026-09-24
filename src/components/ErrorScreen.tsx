"use client";

import { texts } from "@/config/texts";
import { PrimaryButton } from "./PrimaryButton";

/** Échec ou timeout de génération : la photo et les choix sont conservés pour réessayer. */
export function ErrorScreen({ onRetry, onHome }: { retryable: boolean; onRetry: () => void; onHome: () => void }) {
  const gear = (r: number, teeth: number) =>
    Array.from({ length: teeth }, (_, i) => {
      const a = (i / teeth) * Math.PI * 2;
      return <rect key={i} x={-r * 0.12} y={-r - r * 0.22} width={r * 0.24} height={r * 0.3} rx={2} transform={`rotate(${(a * 180) / Math.PI})`} />;
    });
  return (
    <section className="error-screen">
      <svg viewBox="0 0 300 200" className="error-art" aria-hidden>
        <g transform="translate(120 100)" fill="#5FD4FF">
          <g className="gear-a">
            {gear(52, 10)}
            <circle r="52" />
            <circle r="20" fill="#061A4A" />
          </g>
        </g>
        <g transform="translate(200 62)" fill="#ffffff">
          <g className="gear-b">
            {gear(30, 8)}
            <circle r="30" />
            <circle r="11" fill="#061A4A" />
          </g>
        </g>
        <circle className="error-bolt" cx="228" cy="170" r="9" fill="#EF002F" />
      </svg>
      <h1 className="question">{texts.error.title}</h1>
      <p className="lead">{texts.error.subtitle}</p>
      <PrimaryButton onPress={onRetry} className="pulse" autoFocus>
        {texts.error.retry}
      </PrimaryButton>
      <PrimaryButton onPress={onHome} variant="ghost" size="md">
        {texts.error.home}
      </PrimaryButton>
    </section>
  );
}
