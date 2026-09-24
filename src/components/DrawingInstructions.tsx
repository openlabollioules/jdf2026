"use client";

import { texts } from "@/config/texts";
import { PrimaryButton } from "./PrimaryButton";

/** L'enfant dessine sur le vrai tableau Velleda : l'app ne fait que guider. */
export function DrawingInstructions({ onReady }: { onReady: () => void }) {
  return (
    <section className="drawing">
      <svg className="drawing-art" viewBox="0 0 520 360" aria-hidden>
        <rect x="36" y="24" width="448" height="292" rx="14" fill="#ffffff" />
        <rect x="36" y="24" width="448" height="292" rx="14" fill="none" stroke="#c9d6ec" strokeWidth="12" />
        <path d="M90 322 L72 354 M430 322 L448 354" stroke="#c9d6ec" strokeWidth="8" strokeLinecap="round" />
        {/* le croquis qui se dessine */}
        <g className="drawing-sketch" fill="none" stroke="#002A8F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path pathLength={1} d="M150 180 C150 150 200 138 260 138 C320 138 368 152 378 180 C368 208 320 222 260 222 C200 222 150 210 150 180 Z" />
          <path pathLength={1} d="M225 140 L236 110 L282 110 L292 140 M150 170 L118 150 L126 180 L118 210 L150 190" />
          <path pathLength={1} d="M332 172 C344 172 356 176 362 180 C356 184 344 188 332 188" />
          <path pathLength={1} d="M170 196 C220 212 320 212 368 190" stroke="#EF002F" />
        </g>
        <g className="drawing-marker">
          <rect x="-11" y="-78" width="22" height="78" rx="6" fill="#002A8F" />
          <rect x="-11" y="-78" width="22" height="18" rx="6" fill="#EF002F" />
          <path d="M-11 0 L0 18 L11 0 Z" fill="#0b1b3f" />
        </g>
      </svg>
      <h1 className="question">{texts.drawing.title}</h1>
      <p className="lead">{texts.drawing.subtitle}</p>
      <PrimaryButton onPress={onReady}>{texts.drawing.cta}</PrimaryButton>
    </section>
  );
}
