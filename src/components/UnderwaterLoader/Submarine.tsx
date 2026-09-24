import { memo, type CSSProperties } from "react";
import { branding } from "@/config/branding";
import type { ScenePhase } from "@/lib/scene/sceneMachine";
import type { SubPose } from "./geometry";

interface Props {
  phase: ScenePhase;
  pose: SubPose;
  transitionMs: number;
  easing: string;
  withCapsule: boolean;
}

const E = branding.emblem;

/**
 * Sous-marin d'exploration : coque bicolore, kiosque portant l'emblème,
 * visière avant dont les deux capteurs lumineux « regardent » et clignent,
 * propulseur caréné, gouvernes en X, bulles, inclinaison en plongée / remontée.
 * Dessiné autour de (0,0), orienté vers la droite.
 */
export const Submarine = memo(function Submarine({ phase, pose, transitionMs, easing, withCapsule }: Props) {
  const fast = phase === "surfacing" || phase === "diving";
  const moveStyle: CSSProperties = {
    transform: `translate(${pose.x}px, ${pose.y}px)`,
    transition: `transform ${transitionMs}ms ${easing}`,
  };
  const tiltStyle: CSSProperties = {
    transform: `rotate(${pose.tilt}deg)`,
    transition: `transform ${Math.min(700, transitionMs)}ms ease-in-out`,
  };
  const lookStyle: CSSProperties = { transform: `translate(${pose.look.x * 0.6}px, ${pose.look.y * 0.5}px)` };
  const bobbing = phase === "starting" || phase === "laboratory" || phase === "waiting" || phase === "reveal" || phase === "done";
  const beam = phase === "diving" || phase === "laboratory" || phase === "waiting" || phase === "result-ready";

  return (
    <g className="sub" style={moveStyle}>
      <g style={tiltStyle}>
        <g className={bobbing ? "sub-bob" : undefined}>
          {/* Faisceau du projecteur (en profondeur) */}
          <path className={`sub-beam${beam ? " is-on" : ""}`} d="M150 8 L420 -60 L420 90 Z" fill="url(#sub-beam)" />

          {/* Bulles du propulseur */}
          <g className={`sub-bubbles${fast ? " is-fast" : ""}`} transform="translate(-196 2)">
            {Array.from({ length: 12 }, (_, i) => (
              <circle
                key={i}
                className={`sub-bubble${i >= 6 ? " extra" : ""}`}
                r={4 + (i % 4) * 2.5}
                cx={0}
                cy={((i * 13) % 26) - 13}
                style={{ animationDelay: `${(i * 0.23) % 1.4}s` } as CSSProperties}
              />
            ))}
          </g>

          {/* Gouvernes arrière (en X) */}
          <path d="M-120 -24 L-168 -66 L-176 -60 L-146 -16 Z" fill="#c9d6ec" stroke="#0b1b3f" strokeWidth="3" strokeLinejoin="round" />
          <path d="M-120 24 L-168 66 L-176 60 L-146 16 Z" fill="#0b2a6b" stroke="#0b1b3f" strokeWidth="3" strokeLinejoin="round" />

          {/* Propulseur caréné */}
          <g transform="translate(-178 2)">
            <rect x="-14" y="-24" width="30" height="48" rx="10" fill="#0b1b3f" />
            <g className={`sub-prop${fast ? " is-fast" : ""}`}>
              <rect x="-2" y="-20" width="4" height="40" rx="2" fill="#5FD4FF" />
            </g>
            <rect x="-14" y="-24" width="30" height="48" rx="10" fill="none" stroke="#c9d6ec" strokeWidth="3" />
          </g>

          {/* Coque : partie haute claire, partie basse marine, liseré rouge */}
          <clipPath id="sub-hull-clip">
            <path d="M-160 0 C-160 -40 -100 -56 0 -56 C90 -56 150 -40 164 0 C150 40 90 56 0 56 C-100 56 -160 40 -160 0 Z" />
          </clipPath>
          <g clipPath="url(#sub-hull-clip)">
            <rect x="-170" y="-60" width="340" height="120" fill="url(#sub-top)" />
            <path d="M-170 6 C-80 18 80 18 170 6 V60 H-170 Z" fill="url(#sub-bottom)" />
            <path d="M-170 6 C-80 18 80 18 170 6" stroke="#EF002F" strokeWidth="6" fill="none" />
            <path d="M-120 -36 C-60 -48 40 -48 90 -38" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />
            {/* Panneaux de coque */}
            {[-90, -30, 30].map((x) => (
              <line key={x} x1={x} y1={-56} x2={x - 4} y2={56} stroke="#0b1b3f" strokeOpacity="0.12" strokeWidth="2" />
            ))}
          </g>
          <path d="M-160 0 C-160 -40 -100 -56 0 -56 C90 -56 150 -40 164 0 C150 40 90 56 0 56 C-100 56 -160 40 -160 0 Z" fill="none" stroke="#0b1b3f" strokeWidth="4" />

          {/* Feux de navigation */}
          <circle className="nav-light nav-red" cx="-40" cy="30" r="4" />
          <circle className="nav-light nav-green" cx="40" cy="30" r="4" />

          {/* Kiosque avec l'emblème */}
          <path d="M-54 -52 L-38 -108 C-36 -114 -30 -116 -24 -116 L34 -116 C42 -116 46 -112 48 -106 L60 -52 Z" fill="url(#sub-sail)" stroke="#0b1b3f" strokeWidth="4" strokeLinejoin="round" />
          <path d="M8 -116 L8 -140 L30 -140" stroke="#0b1b3f" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle className="mast-light" cx="30" cy="-140" r="4" />
          <image href={E.src} x={-26} y={-104} width={56} height={(56 * E.height) / E.width} />
          {/* Petits ailerons de kiosque */}
          <path d="M-44 -78 L-72 -74 L-44 -68 Z M52 -78 L80 -74 L54 -68 Z" fill="#c9d6ec" stroke="#0b1b3f" strokeWidth="3" strokeLinejoin="round" />

          {/* Visière avant + capteurs (le « regard » du sous-marin) */}
          <path d="M92 -34 C124 -30 152 -18 162 -2 C152 14 124 24 92 28 C100 10 100 -16 92 -34 Z" fill="url(#sub-visor)" stroke="#0b1b3f" strokeWidth="4" />
          <path d="M104 -24 C124 -20 140 -12 148 -4" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
          <g className="sub-eyes" style={lookStyle}>
            <g className="sub-eye">
              <circle cx="118" cy="-4" r="9" fill="#5FD4FF" />
              <circle cx="118" cy="-4" r="15" fill="#5FD4FF" opacity="0.25" />
            </g>
            <g className="sub-eye">
              <circle cx="143" cy="-2" r="7" fill="#5FD4FF" />
              <circle cx="143" cy="-2" r="12" fill="#5FD4FF" opacity="0.25" />
            </g>
          </g>

          {/* Capsule remise par le centre d'essais */}
          {withCapsule && (
            <g className="sub-capsule" transform="translate(-6 78)">
              <Capsule />
            </g>
          )}
        </g>
      </g>
    </g>
  );
});

/** Capsule lumineuse marquée de l'emblème (contient symboliquement le drone). */
export function Capsule() {
  return (
    <g>
      <circle r="60" fill="url(#capsule-glow)" className="capsule-glow" />
      <rect x="-48" y="-24" width="96" height="48" rx="24" fill="#ffffff" stroke="#0b1b3f" strokeWidth="4" />
      <rect x="-48" y="-5" width="96" height="10" fill="#EF002F" opacity="0.9" />
      <rect x="-48" y="-24" width="96" height="48" rx="24" fill="none" stroke="#0b1b3f" strokeWidth="4" />
      <circle cx="0" cy="0" r="17" fill="#ffffff" stroke="#0b1b3f" strokeWidth="3" />
      <image href={E.src} x={-12} y={-10} width={24} height={(24 * E.height) / E.width} />
    </g>
  );
}
